import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { listFacts, deleteFact } from '../services/memoryService.js';
import { logger } from '../lib/logger.js';

export const meRouter = Router();
meRouter.use(requireAuth);

// User rights over memory (spec Section 7)
meRouter.get('/memory', async (req, res, next) => {
  try {
    res.json({ facts: await listFacts(req.user.id) });
  } catch (err) {
    next(err);
  }
});

meRouter.delete('/memory/:id', async (req, res, next) => {
  try {
    const ok = await deleteFact(req.user.id, req.params.id);
    if (!ok) return res.status(404).json({ error: 'fact not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Full data deletion — compliance blocker (spec Section 0.5). Cascades to everything.
meRouter.delete('/', async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.user.id } });
    logger.info({ userId: req.user.id }, 'account fully deleted at user request');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
