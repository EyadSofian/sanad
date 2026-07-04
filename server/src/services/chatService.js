import { prisma } from '../lib/prisma.js';
import { generateMainStream } from '../lib/llm.js';
import { crisisPrecheck } from '../safety/precheck.js';
import { classifyMessage } from './routerService.js';
import { resolvePersona, parseTarsCommand, guessLang } from './personaPolicy.js';
import { handleCrisis, isPersonaLocked } from './crisisService.js';
import { buildContext } from './contextService.js';
import { CORE_PROMPT, personaPrompt } from '../prompts/prompts.js';
import { logger } from '../lib/logger.js';

/** Minimal SSE writer. */
function sseWriter(res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  return {
    event(name, data) {
      res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    end() {
      res.end();
    },
  };
}

async function getOrCreateSession(user, sessionId) {
  if (sessionId) {
    const existing = await prisma.session.findFirst({ where: { id: sessionId, userId: user.id } });
    // A session the worker already closed (30 min idle → facts extracted) is expired:
    // start a fresh one, which also re-triggers the disclosure at session start (spec 0.2).
    if (existing && !existing.endedAt) return { session: existing, isNew: false };
  }
  const session = await prisma.session.create({ data: { userId: user.id } });
  return { session, isNew: true };
}

/**
 * POST /api/chat — the full request flow of spec Section 2.
 * Accepts {text, sessionId} JSON or multipart with an `audio` file (webm/opus).
 */
export async function handleChat({ req, res, user }) {
  const sse = sseWriter(res);
  try {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const sessionIdParam = req.body?.sessionId || null;
    const audioFile = req.files?.audio?.[0] || req.file || null;
    const audio = audioFile ? { buffer: audioFile.buffer, mimeType: audioFile.mimetype } : null;

    if (!text && !audio) {
      sse.event('error', { message: 'empty message' });
      return sse.end();
    }

    const { session, isNew } = await getOrCreateSession(user, sessionIdParam);

    // ---- [1] fast crisis pre-check (synchronous, no LLM) on text input ----
    let precheck = text ? crisisPrecheck(text) : { hit: false, matches: [] };

    // ---- [2] ROUTER (also transcribes audio in the same call) ----
    let route;
    let effectiveText = text;
    if (precheck.hit) {
      // Explicit crisis language: skip the router entirely (spec Section 2).
      route = { persona: 'CASE', emotion: 'crisis', intensity: 5, crisis: true, kb_query: null, lang: guessLang(text) };
    } else {
      route = await classifyMessage({ text, audio });
      if (audio && route.transcript) {
        effectiveText = route.transcript;
        // Voice message: run the regex pre-check on the transcript too.
        precheck = crisisPrecheck(effectiveText);
        if (precheck.hit) route = { ...route, crisis: true, intensity: 5 };
      }
    }
    if (!effectiveText) effectiveText = '(voice message)';

    // ---- crisis path: fixed skeleton, personas skipped entirely ----
    if (route.crisis || precheck.hit) {
      const trigger = precheck.hit ? `precheck:${precheck.matches.join('|')}` : 'router:crisis=true';
      const result = await handleCrisis({ user, session, text: effectiveText, trigger });
      sse.event('meta', {
        sessionId: session.id,
        newSession: isNew,
        persona: 'CRISIS',
        crisis: true,
        emotion: route.emotion,
        intensity: route.intensity,
        lang: result.lang,
        ttsAllowed: false, // TTS suppressed in crisis (spec Section 4.5)
      });
      sse.event('crisis_resources', result.resources);
      sse.event('delta', { text: result.reply });
      sse.event('done', { messageId: result.assistantMessageId, content: result.reply });
      return sse.end();
    }

    // ---- TARS runtime settings command ("TARS: humor 40") — no LLM round-trip ----
    const tarsCmd = text ? parseTarsCommand(text) : null;
    if (tarsCmd) {
      await prisma.user.update({ where: { id: user.id }, data: { [tarsCmd.setting]: tarsCmd.value } });
      const isAr = guessLang(text) === 'ar' || user.locale === 'ar';
      const settingName = tarsCmd.setting === 'tarsHumor' ? (isAr ? 'الهزار' : 'humor') : (isAr ? 'الصراحة' : 'honesty');
      const reply = isAr
        ? `تمام. ظبطت ${settingName} على ${tarsCmd.value}٪.`
        : `Done. ${settingName} set to ${tarsCmd.value}%.`;
      await prisma.message.create({
        data: { sessionId: session.id, role: 'user', content: text, emotion: 'neutral', intensity: 1 },
      });
      const saved = await prisma.message.create({
        data: { sessionId: session.id, role: 'assistant', persona: 'TARS', content: reply },
      });
      sse.event('meta', { sessionId: session.id, newSession: isNew, persona: 'TARS', crisis: false, emotion: 'neutral', intensity: 1, lang: isAr ? 'ar' : 'en', ttsAllowed: false });
      sse.event('delta', { text: reply });
      sse.event('done', { messageId: saved.id, content: reply });
      return sse.end();
    }

    // ---- post-crisis lockout check ----
    const locked = await isPersonaLocked(session.id, user.id);
    const persona = resolvePersona(route, { locked });

    // ---- [3] context builder (history fetched BEFORE persisting the new message) ----
    const { contextBlock, contents } = await buildContext({ user, session, route, userText: effectiveText });

    // ---- [5a] persist user message ----
    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: effectiveText,
        emotion: route.emotion,
        intensity: route.intensity,
      },
    });

    sse.event('meta', {
      sessionId: session.id,
      newSession: isNew,
      persona,
      crisis: false,
      emotion: route.emotion,
      intensity: route.intensity,
      lang: route.lang,
      locked,
      ttsAllowed: Boolean(user.ttsEnabled),
    });

    // ---- [4] generate (streaming) ----
    const system = [CORE_PROMPT, personaPrompt(persona, user), contextBlock].join('\n\n---\n\n');
    const allContents = [...contents, { role: 'user', parts: [{ text: effectiveText }] }];

    let full = '';
    try {
      const stream = await generateMainStream({
        system,
        contents: allContents,
        temperature: persona === 'FRIDAY' ? 0.4 : 0.7,
        label: `chat:${persona}`,
      });
      for await (const chunk of stream) {
        full += chunk;
        sse.event('delta', { text: chunk });
      }
    } catch (err) {
      logger.error({ err: err.message }, 'generation failed mid-turn');
      if (!full) {
        const apology =
          route.lang === 'ar'
            ? 'حصلت مشكلة تقنية عندي دلوقتي. جرب تاني بعد شوية — رسالتك متسجلة.'
            : 'I hit a technical problem on my side. Please try again in a moment — your message is saved.';
        sse.event('delta', { text: apology });
        full = apology;
      }
    }

    // ---- [5b] persist assistant message ----
    const saved = await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        persona,
        content: full,
        emotion: route.emotion,
        intensity: route.intensity,
      },
    });

    sse.event('done', { messageId: saved.id, content: full });
    sse.end();
    // [6] fact extraction / summaries run in the worker at session end — not inline.
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'chat handler failed');
    try {
      sse.event('error', { message: 'internal error' });
      sse.end();
    } catch {
      /* stream already gone */
    }
  }
}
