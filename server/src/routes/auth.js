import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { signToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimits.js';

export const authRouter = Router();
authRouter.use(authLimiter);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    locale: u.locale,
    tarsHonesty: u.tarsHonesty,
    tarsHumor: u.tarsHumor,
    ttsEnabled: u.ttsEnabled,
  };
}

// 18+ age gate is a signup blocker (spec Section 0.4) — consent flag stored.
authRouter.post('/signup', async (req, res, next) => {
  try {
    const { email, password, locale = 'ar', isAdultConfirmed } = req.body || {};
    if (!EMAIL_RE.test(email || '')) return res.status(400).json({ error: 'invalid email' });
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'password must be at least 8 characters' });
    }
    if (isAdultConfirmed !== true) {
      return res.status(400).json({ error: 'you must confirm you are 18 or older', code: 'AGE_GATE' });
    }
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ error: 'email already registered' });
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passHash: await bcrypt.hash(password, 12),
        locale: locale === 'en' ? 'en' : 'ar',
        isAdultConfirmed: true,
      },
    });
    res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const user = await prisma.user.findUnique({ where: { email: (email || '').toLowerCase() } });
    if (!user || !(await bcrypt.compare(password || '', user.passHash))) {
      return res.status(401).json({ error: 'wrong email or password' });
    }
    res.json({ token: signToken(user.id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});
