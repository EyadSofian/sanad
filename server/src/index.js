import { createApp } from './app.js';
import { env, productionSanityCheck } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { getCrisisResources } from './config/crisisResources.js';

productionSanityCheck(logger);
getCrisisResources(); // fail fast + log unverified-number compliance warning at boot

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'sanad web service up');
});

async function shutdown(signal) {
  logger.info({ signal }, 'shutting down');
  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
