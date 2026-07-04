/**
 * Session-end pipeline (spec Section 2 [6] + Section 7 L2):
 * a session with no activity for IDLE_MINUTES is closed, then — best-effort —
 * facts are extracted (flash-lite → embed → memory_facts upsert) and a summary stored.
 *
 * Extraction is best-effort by design: the session is closed FIRST so an LLM outage
 * can never pile sessions up; a missed extraction is an acceptable memory gap.
 */
import { prisma } from '../lib/prisma.js';
import { generateUtilityText, isUtilityLlmConfigured } from '../lib/llm.js';
import { FACT_EXTRACTION_PROMPT, SESSION_SUMMARY_PROMPT } from '../prompts/prompts.js';
import { extractJson } from '../lib/text.js';
import { upsertFact } from '../services/memoryService.js';
import { logger } from '../lib/logger.js';

export const IDLE_MINUTES = 30;
const TRANSCRIPT_CHAR_CAP = 12_000;
const FACT_CATEGORIES = new Set(['work', 'health', 'relations', 'goals', 'patterns']);

function renderTranscript(messages) {
  const lines = messages.map((m) => `${m.role === 'user' ? 'user' : 'assistant'}: ${m.content}`);
  let out = lines.join('\n');
  if (out.length > TRANSCRIPT_CHAR_CAP) out = out.slice(-TRANSCRIPT_CHAR_CAP); // keep the tail — most recent context
  return out;
}

async function extractFacts(userId, messages) {
  const userTurns = messages.filter((m) => m.role === 'user');
  if (userTurns.length < 2) return 0; // nothing durable comes out of a one-liner

  const raw = await generateUtilityText({
    system: FACT_EXTRACTION_PROMPT,
    contents: [{ role: 'user', parts: [{ text: renderTranscript(messages) }] }],
    temperature: 0,
    json: true,
    maxOutputTokens: 1024,
    label: 'facts',
  });
  const items = extractJson(raw);
  if (!Array.isArray(items)) return 0;

  let stored = 0;
  const lastUserMessageId = userTurns[userTurns.length - 1].id;
  for (const item of items.slice(0, 8)) {
    const fact = typeof item?.fact === 'string' ? item.fact.trim().slice(0, 500) : '';
    if (!fact) continue;
    const category = FACT_CATEGORIES.has(item.category) ? item.category : 'patterns';
    await upsertFact(userId, { fact, category, sourceMessageId: lastUserMessageId });
    stored += 1;
  }
  return stored;
}

async function summarize(messages) {
  const summary = await generateUtilityText({
    system: SESSION_SUMMARY_PROMPT,
    contents: [{ role: 'user', parts: [{ text: renderTranscript(messages) }] }],
    temperature: 0.2,
    maxOutputTokens: 256,
    label: 'summary',
  });
  return summary?.trim().slice(0, 1000) || null;
}

/** One sweep pass. Returns counts for logging/tests. */
export async function closeIdleSessions({ idleMinutes = IDLE_MINUTES, batch = 50 } = {}) {
  const cutoff = new Date(Date.now() - idleMinutes * 60_000);
  const candidates = await prisma.session.findMany({
    where: { endedAt: null, startedAt: { lt: cutoff } },
    select: { id: true, userId: true },
    take: batch,
    orderBy: { startedAt: 'asc' },
  });

  let closed = 0;
  let factsStored = 0;
  for (const session of candidates) {
    try {
      const last = await prisma.message.findFirst({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      if (last && last.createdAt >= cutoff) continue; // still active

      await prisma.session.update({ where: { id: session.id }, data: { endedAt: new Date() } });
      closed += 1;

      if (!isUtilityLlmConfigured()) continue;
      const messages = await prisma.message.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'asc' },
        select: { id: true, role: true, content: true },
      });
      if (messages.length === 0) continue;

      try {
        factsStored += await extractFacts(session.userId, messages);
        const summary = await summarize(messages);
        if (summary) await prisma.session.update({ where: { id: session.id }, data: { summary } });
      } catch (err) {
        logger.warn({ sessionId: session.id, err: err.message }, 'post-session extraction failed — session stays closed');
      }
    } catch (err) {
      logger.error({ sessionId: session.id, err: err.message }, 'session sweep failed for session');
    }
  }

  if (closed > 0) logger.info({ closed, factsStored }, 'session sweep done');
  return { candidates: candidates.length, closed, factsStored };
}
