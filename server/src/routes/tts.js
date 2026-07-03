import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { speakMessage } from '../services/ttsService.js';

export const ttsRouter = Router();
ttsRouter.use(requireAuth);

// Per-message opt-in speaker button (spec Section 9). Returns mp3, or a JSON fallback signal.
ttsRouter.post('/', async (req, res, next) => {
  try {
    const { messageId } = req.body || {};
    if (!messageId) return res.status(400).json({ error: 'messageId required' });
    const result = await speakMessage({ user: req.user, messageId });
    if (result.status !== 200) {
      return res.status(result.status).json({ error: result.error, fallback: result.fallback || null });
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-TTS-Credits-Used', String(Math.round(result.usage.used)));
    res.setHeader('X-TTS-Budget', String(result.usage.budget));
    if (result.warn) res.setHeader('X-TTS-Warning', 'budget-80-percent');
    res.send(result.audio);
  } catch (err) {
    next(err);
  }
});
