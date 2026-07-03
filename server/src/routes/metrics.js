import { Router } from 'express';
import { env } from '../config/env.js';
import { verifySignature } from '../lib/hmac.js';
import { recordMetric } from '../services/metricsService.js';

export const metricsRouter = Router();

// n8n → HMAC-signed (x-signature: hex hmac-sha256 of raw body) — no JWT (spec Section 8/10).
metricsRouter.post('/', async (req, res, next) => {
  try {
    if (!env.METRICS_HMAC_SECRET) return res.status(503).json({ error: 'metrics ingestion not configured' });
    const sig = req.headers['x-signature'];
    if (!verifySignature(req.rawBody, sig, env.METRICS_HMAC_SECRET)) {
      return res.status(401).json({ error: 'bad signature' });
    }
    const result = await recordMetric(req.body || {});
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.status(result.status).json({ ok: true, id: result.id });
  } catch (err) {
    next(err);
  }
});
