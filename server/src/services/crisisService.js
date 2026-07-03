import { prisma } from '../lib/prisma.js';
import { getCrisisResources } from '../config/crisisResources.js';
import { CRISIS_TEMPLATES } from '../prompts/prompts.js';
import { logger } from '../lib/logger.js';

export const CRISIS_PERSONA = 'CRISIS';
const CALM_STREAK_REQUIRED = 3; // consecutive user messages with intensity < 3 to unlock personas
const CALM_INTENSITY_BELOW = 3;

/**
 * Fixed-skeleton crisis handling (spec Section 4). Deterministic — no LLM freeform.
 * Persists both messages, logs the crisis_event, returns everything the SSE layer emits.
 */
export async function handleCrisis({ user, session, text, trigger }) {
  const lang = /[؀-ۿ]/.test(text || '') ? 'ar' : user.locale === 'en' ? 'en' : 'ar';

  const userMessage = await prisma.message.create({
    data: {
      sessionId: session.id,
      role: 'user',
      content: text || '(voice message)',
      emotion: 'crisis',
      intensity: 5,
    },
  });

  await prisma.crisisEvent.create({
    data: {
      userId: user.id,
      messageId: userMessage.id,
      trigger: trigger.slice(0, 500),
      action: 'crisis_protocol_shown',
    },
  });
  logger.warn({ userId: user.id, sessionId: session.id }, 'crisis protocol activated');

  const reply = CRISIS_TEMPLATES[lang] ?? CRISIS_TEMPLATES.ar;
  const assistantMessage = await prisma.message.create({
    data: {
      sessionId: session.id,
      role: 'assistant',
      persona: CRISIS_PERSONA,
      content: reply,
      emotion: 'calm',
      intensity: null,
    },
  });

  return {
    reply,
    resources: getCrisisResources(),
    userMessageId: userMessage.id,
    assistantMessageId: assistantMessage.id,
    lang,
  };
}

/**
 * Post-crisis lockout (spec Section 4.6): personas stay disabled until the router
 * reports intensity < 3 for 3 consecutive user messages after the last crisis event.
 */
export async function isPersonaLocked(sessionId, userId) {
  const lastCrisis = await prisma.crisisEvent.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, message: { select: { sessionId: true } } },
  });
  if (!lastCrisis) return false;
  // Lockout is per-session: a crisis in this session locks it until calm streak.
  if (lastCrisis.message?.sessionId && lastCrisis.message.sessionId !== sessionId) return false;

  const after = await prisma.message.findMany({
    where: { sessionId, role: 'user', createdAt: { gt: lastCrisis.createdAt } },
    orderBy: { createdAt: 'desc' },
    take: CALM_STREAK_REQUIRED,
    select: { intensity: true },
  });
  if (after.length < CALM_STREAK_REQUIRED) return true;
  return !after.every((m) => m.intensity != null && m.intensity < CALM_INTENSITY_BELOW);
}
