import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/** 60 msg/hr/user on /api/chat (spec Section 10) — keyed by user id, not IP. */
export const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.RATE_LIMIT_CHAT_PER_HOUR,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'rate limit exceeded — try again later' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'too many attempts — try again later' },
});
