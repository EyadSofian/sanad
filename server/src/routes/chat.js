import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimits.js';
import { handleChat } from '../services/chatService.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = /^audio\//.test(file.mimetype);
    cb(ok ? null : new Error('only audio uploads allowed'), ok);
  },
});

export const chatRouter = Router();

// multipart (voice) or JSON (text) → SSE stream
chatRouter.post('/', requireAuth, chatLimiter, upload.fields([{ name: 'audio', maxCount: 1 }]), (req, res) =>
  handleChat({ req, res, user: req.user })
);
