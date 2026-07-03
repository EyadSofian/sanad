import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { authRouter } from './routes/auth.js';
import { chatRouter } from './routes/chat.js';
import { sessionsRouter } from './routes/sessions.js';
import { settingsRouter } from './routes/settings.js';
import { meRouter } from './routes/me.js';
import { metricsRouter } from './routes/metrics.js';
import { digestRouter } from './routes/digest.js';
import { ttsRouter } from './routes/tts.js';
import { errorHandler } from './middleware/error.js';

const here = path.dirname(fileURLToPath(import.meta.url));

function resolveStaticDir() {
  const candidates = [env.STATIC_DIR, path.resolve(here, '../../web/dist'), path.resolve(process.cwd(), 'web/dist')].filter(Boolean);
  return candidates.find((p) => fs.existsSync(path.join(p, 'index.html'))) || null;
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Railway sits behind a proxy
  app.use(helmet({ contentSecurityPolicy: false }));

  if (env.CORS_ORIGIN) {
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', env.CORS_ORIGIN);
      res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, x-signature');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      if (req.method === 'OPTIONS') return res.status(204).end();
      next();
    });
  }

  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/health' },
      customLogLevel: (req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
    })
  );

  // rawBody is kept for HMAC verification on /api/metrics
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  app.get('/health', (req, res) => {
    res.json({ ok: true, service: 'sanad', uptime: Math.round(process.uptime()) });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/me', meRouter);
  app.use('/api/metrics', metricsRouter);
  app.use('/api/digest', digestRouter);
  app.use('/api/tts', ttsRouter);

  // static PWA + SPA fallback
  const staticDir = resolveStaticDir();
  if (staticDir) {
    app.use(express.static(staticDir, { maxAge: '1h', index: 'index.html' }));
    app.get(/^\/(?!api\/|health).*/, (req, res) => res.sendFile(path.join(staticDir, 'index.html')));
    logger.info({ staticDir }, 'serving web build');
  } else {
    logger.warn('web/dist not found — API-only mode (run `npm run build` for the PWA)');
  }

  app.use(errorHandler);
  return app;
}
