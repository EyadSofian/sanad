import { logger } from '../lib/logger.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  logger.error({ err: err.message, stack: err.stack, path: req.path }, 'unhandled route error');
  if (res.headersSent) return res.end();
  res.status(err.status || 500).json({ error: err.expose ? err.message : 'internal error' });
}
