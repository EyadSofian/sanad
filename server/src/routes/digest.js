import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const digestRouter = Router();
digestRouter.use(requireAuth);

digestRouter.get('/latest', async (req, res, next) => {
  try {
    const digest = await prisma.digest.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, weekStart: true, content: true, createdAt: true },
    });
    res.json({ digest }); // null when no digest yet
  } catch (err) {
    next(err);
  }
});
