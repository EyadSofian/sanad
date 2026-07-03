import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const sessionsRouter = Router();
sessionsRouter.use(requireAuth);

sessionsRouter.get('/', async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id },
      orderBy: { startedAt: 'desc' },
      take: 50,
      select: { id: true, startedAt: true, endedAt: true, summary: true },
    });
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

sessionsRouter.get('/:id/messages', async (req, res, next) => {
  try {
    const session = await prisma.session.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      select: { id: true },
    });
    if (!session) return res.status(404).json({ error: 'session not found' });
    const messages = await prisma.message.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, persona: true, content: true, emotion: true, intensity: true, createdAt: true },
    });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});
