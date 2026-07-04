import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { generateUtilityText } from '../lib/llm.js';
import { TTS_COMPRESS_PROMPT } from '../prompts/prompts.js';
import { shouldCompressForSpeech, truncateAtSentence, stripMarkdown } from '../lib/text.js';
import { logger } from '../lib/logger.js';

export const CREDITS_PER_CHAR = 0.5; // eleven_flash_v2_5 (spec Section 1)
export const WARN_RATIO = 0.8;
const ELEVEN_MODEL = 'eleven_flash_v2_5';

export async function getUsage() {
  const agg = await prisma.ttsUsage.aggregate({ _sum: { credits: true } });
  const used = agg._sum.credits || 0;
  const budget = env.TTS_CREDIT_BUDGET;
  return { used, budget, ratio: budget > 0 ? used / budget : 1 };
}

/** Pure budget policy — unit-tested. */
export function budgetDecision({ used, budget, textLength }) {
  const cost = textLength * CREDITS_PER_CHAR;
  if (budget <= 0 || used + cost > budget) return { allowed: false, warn: true, cost };
  return { allowed: true, warn: (used + cost) / budget >= WARN_RATIO, cost };
}

async function compressForSpeech(text) {
  try {
    const out = await generateUtilityText({
      system: TTS_COMPRESS_PROMPT,
      contents: [{ role: 'user', parts: [{ text }] }],
      temperature: 0.3,
      maxOutputTokens: 256,
      label: 'tts:compress',
    });
    const cleaned = stripMarkdown(out);
    if (cleaned && cleaned.length <= 400) return cleaned;
    return truncateAtSentence(cleaned || text);
  } catch (err) {
    logger.warn({ err: err.message }, 'tts compress failed — sentence-truncating instead');
    return truncateAtSentence(stripMarkdown(text));
  }
}

async function elevenLabsSynthesize(text) {
  if (!env.ELEVENLABS_API_KEY || !env.ELEVEN_VOICE_ID) {
    const err = new Error('ElevenLabs not configured');
    err.code = 'TTS_NOT_CONFIGURED';
    throw err;
  }
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${env.ELEVEN_VOICE_ID}?output_format=mp3_44100_64`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ text, model_id: ELEVEN_MODEL }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      throw new Error(`ElevenLabs ${resp.status}: ${body.slice(0, 200)}`);
    }
    return Buffer.from(await resp.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Speak one assistant message (spec Section 9):
 * >350 chars → flash-lite compression · budget guard · content-hash cache ·
 * failure → {fallback:'browser'} so the client uses speechSynthesis.
 */
export async function speakMessage({ user, messageId }) {
  const message = await prisma.message.findFirst({
    where: { id: messageId, role: 'assistant', session: { userId: user.id } },
  });
  if (!message) return { status: 404, error: 'message not found' };
  if (message.persona === 'CRISIS') return { status: 403, error: 'tts suppressed for crisis messages' };
  if (!user.ttsEnabled) return { status: 403, error: 'tts disabled in settings' };

  let speech = stripMarkdown(message.content);
  if (shouldCompressForSpeech(speech)) speech = await compressForSpeech(message.content);
  if (!speech) return { status: 422, error: 'nothing to speak' };

  const usage = await getUsage();
  const decision = budgetDecision({ used: usage.used, budget: usage.budget, textLength: speech.length });
  if (!decision.allowed) {
    return { status: 402, error: 'tts budget exhausted', fallback: 'browser', usage };
  }

  const hash = crypto.createHash('sha256').update(`${env.ELEVEN_VOICE_ID}|${ELEVEN_MODEL}|${speech}`).digest('hex');
  const cached = await prisma.ttsCache.findUnique({ where: { hash } });
  if (cached) {
    return { status: 200, audio: Buffer.from(cached.audio), warn: decision.warn, usage, cached: true };
  }

  let audio;
  try {
    audio = await elevenLabsSynthesize(speech);
  } catch (err) {
    logger.warn({ err: err.message }, 'elevenlabs failed — client falls back to speechSynthesis');
    return { status: 502, error: 'tts provider failed', fallback: 'browser' };
  }

  await prisma.$transaction([
    prisma.ttsCache.upsert({
      where: { hash },
      create: { hash, audio, chars: speech.length },
      update: {},
    }),
    prisma.ttsUsage.create({
      data: { userId: user.id, chars: speech.length, credits: decision.cost },
    }),
  ]);

  const after = await getUsage();
  return { status: 200, audio, warn: after.ratio >= WARN_RATIO, usage: after, cached: false };
}
