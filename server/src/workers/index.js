/**
 * SANAD worker service (Railway service #2, spec Section 1: cron via node-cron).
 *   every 5 min — close idle sessions → L2 fact extraction + session summary
 *   03:00       — nightly L3 profile rebuild
 *   Sun 06:00   — weekly memory decay + Objective Mirror digests
 * All times Africa/Cairo.
 */
import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { productionSanityCheck } from '../config/env.js';
import { closeIdleSessions } from './sessionSweep.js';
import { rebuildProfiles } from './profileRebuild.js';
import { runWeekly } from './weekly.js';

const TZ = 'Africa/Cairo';

productionSanityCheck(logger);

/** Serialize each job with itself — a slow LLM pass must not overlap its next tick. */
function guarded(name, fn) {
  let running = false;
  return async () => {
    if (running) {
      logger.warn({ job: name }, 'previous run still in progress — skipping tick');
      return;
    }
    running = true;
    const startedAt = Date.now();
    try {
      await fn();
      logger.debug({ job: name, ms: Date.now() - startedAt }, 'job finished');
    } catch (err) {
      logger.error({ job: name, err: err.message, stack: err.stack }, 'job crashed');
    } finally {
      running = false;
    }
  };
}

const sweep = guarded('session-sweep', closeIdleSessions);
const profiles = guarded('profile-rebuild', rebuildProfiles);
const weekly = guarded('weekly-pass', runWeekly);

cron.schedule('*/5 * * * *', sweep, { timezone: TZ });
cron.schedule('0 3 * * *', profiles, { timezone: TZ });
cron.schedule('0 6 * * 0', weekly, { timezone: TZ }); // Sunday (spec Section 8)

logger.info({ tz: TZ }, 'sanad worker up — sweep */5m, profiles 03:00, weekly Sun 06:00');
sweep(); // catch up immediately after (re)deploys

async function shutdown(signal) {
  logger.info({ signal }, 'worker shutting down');
  await prisma.$disconnect().catch(() => {});
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
