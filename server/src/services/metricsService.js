import { prisma } from '../lib/prisma.js';
import { generateMainText } from '../lib/llm.js';
import { CORE_PROMPT, personaPrompt, DIGEST_PROMPT } from '../prompts/prompts.js';
import { logger } from '../lib/logger.js';

/** Store one Objective Mirror datapoint (n8n → HMAC-verified route). */
export async function recordMetric({ email, source, metric, value, day }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { status: 404, error: 'unknown user email' };
  const numeric = Number(value);
  if (!source || !metric || !Number.isFinite(numeric)) return { status: 400, error: 'source, metric, numeric value required' };
  const dayDate = day ? new Date(`${day}T00:00:00Z`) : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  if (Number.isNaN(dayDate.getTime())) return { status: 400, error: 'invalid day (YYYY-MM-DD)' };
  const row = await prisma.metricsLog.create({
    data: { userId: user.id, source: String(source).slice(0, 100), metric: String(metric).slice(0, 100), value: numeric, day: dayDate },
  });
  return { status: 201, id: row.id };
}

function sumByMetric(rows) {
  const out = new Map();
  for (const r of rows) {
    const key = `${r.source}/${r.metric}`;
    out.set(key, (out.get(key) || 0) + r.value);
  }
  return out;
}

/**
 * Weekly Objective Mirror digest (spec Section 8): real numbers + trend vs last week,
 * TARS voice, in-app only (never TTS). Returns null when the user has no data.
 */
export async function buildWeeklyDigest(user, now = new Date()) {
  const dayMs = 86_400_000;
  const end = new Date(now.toISOString().slice(0, 10) + 'T00:00:00Z');
  const start = new Date(end.getTime() - 7 * dayMs);
  const prevStart = new Date(end.getTime() - 14 * dayMs);

  const [current, previous] = await Promise.all([
    prisma.metricsLog.findMany({ where: { userId: user.id, day: { gte: start, lt: end } } }),
    prisma.metricsLog.findMany({ where: { userId: user.id, day: { gte: prevStart, lt: start } } }),
  ]);
  if (current.length === 0 && previous.length === 0) return null;

  const cur = sumByMetric(current);
  const prev = sumByMetric(previous);
  const lines = [];
  for (const key of new Set([...cur.keys(), ...prev.keys()])) {
    const c = cur.get(key) || 0;
    const p = prev.get(key) || 0;
    const delta = p === 0 ? (c > 0 ? '+new' : '0') : `${c >= p ? '+' : ''}${Math.round(((c - p) / p) * 100)}%`;
    lines.push(`${key}: this week ${c}, last week ${p} (${delta})`);
  }
  const numbers = lines.join('\n');

  let content;
  try {
    content = await generateMainText({
      system: [CORE_PROMPT, personaPrompt('TARS', user), DIGEST_PROMPT].join('\n\n---\n\n'),
      contents: [
        {
          role: 'user',
          parts: [{ text: `User locale: ${user.locale}\nWEEKLY NUMBERS (real, verified):\n${numbers}` }],
        },
      ],
      temperature: 0.5,
      maxOutputTokens: 512,
      label: 'digest',
    });
  } catch (err) {
    logger.warn({ err: err.message, userId: user.id }, 'digest LLM failed — storing plain numbers');
    content = null;
  }
  if (!content || !content.trim()) {
    content =
      user.locale === 'ar'
        ? `ملخص الأسبوع (أرقام فقط):\n${numbers}`
        : `Weekly summary (raw numbers):\n${numbers}`;
  }

  const digest = await prisma.digest.create({
    data: { userId: user.id, weekStart: start, content: content.trim() },
  });
  return digest;
}
