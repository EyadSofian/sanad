import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { getUsage } from '../services/ttsService.js';
import { getEngineInfo } from '../lib/llm.js';

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

function settingsView(u, ttsUsage) {
  return {
    email: u.email,
    locale: u.locale,
    tarsHonesty: u.tarsHonesty,
    tarsHumor: u.tarsHumor,
    ttsEnabled: u.ttsEnabled,
    ttsUsage,
    engine: getEngineInfo(),
  };
}

settingsRouter.get('/', async (req, res, next) => {
  try {
    res.json(settingsView(req.user, await getUsage()));
  } catch (err) {
    next(err);
  }
});

settingsRouter.patch('/', async (req, res, next) => {
  try {
    const { locale, tarsHonesty, tarsHumor, ttsEnabled } = req.body || {};
    const data = {};
    if (locale !== undefined) {
      if (!['ar', 'en'].includes(locale)) return res.status(400).json({ error: 'locale must be ar|en' });
      data.locale = locale;
    }
    for (const [key, val] of [
      ['tarsHonesty', tarsHonesty],
      ['tarsHumor', tarsHumor],
    ]) {
      if (val !== undefined) {
        const n = Number(val);
        if (!Number.isInteger(n) || n < 0 || n > 100) return res.status(400).json({ error: `${key} must be 0–100` });
        data[key] = n;
      }
    }
    if (ttsEnabled !== undefined) {
      if (typeof ttsEnabled !== 'boolean') return res.status(400).json({ error: 'ttsEnabled must be boolean' });
      data.ttsEnabled = ttsEnabled;
    }
    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json(settingsView(user, await getUsage()));
  } catch (err) {
    next(err);
  }
});
