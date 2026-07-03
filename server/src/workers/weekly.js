/**
 * Weekly pass (spec Sections 7 + 8):
 *   1. memory decay — salience *= 0.98, prune < 0.2 (patterns are kept)
 *   2. Objective Mirror digest (TARS voice, real numbers + trend) for every user
 *      with metrics activity in the last 14 days. In-app only, never TTS.
 */
import { prisma } from '../lib/prisma.js';
import { decayFacts } from '../services/memoryService.js';
import { buildWeeklyDigest } from '../services/metricsService.js';
import { logger } from '../lib/logger.js';

export async function runWeekly(now = new Date()) {
  try {
    await decayFacts();
  } catch (err) {
    logger.error({ err: err.message }, 'memory decay failed');
  }

  const since = new Date(now.getTime() - 14 * 86_400_000);
  const active = await prisma.metricsLog.findMany({
    where: { day: { gte: since } },
    select: { userId: true },
    distinct: ['userId'],
  });

  let digests = 0;
  for (const { userId } of active) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) continue;
      const digest = await buildWeeklyDigest(user, now);
      if (digest) digests += 1;
    } catch (err) {
      logger.error({ userId, err: err.message }, 'weekly digest failed for user');
    }
  }

  logger.info({ users: active.length, digests }, 'weekly pass done');
  return { users: active.length, digests };
}
