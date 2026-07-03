import { generateText, MODELS } from '../lib/gemini.js';
import { ROUTER_PROMPT, ROUTER_AUDIO_ADDENDUM } from '../prompts/prompts.js';
import { parseRoute, defaultRoute, guessLang } from './personaPolicy.js';
import { logger } from '../lib/logger.js';

/**
 * ROUTER — gemini-2.5-flash-lite, temperature 0, JSON (spec 5.0).
 * For audio it also transcribes (one multimodal call — no separate STT service, spec Section 1).
 * Router failure NEVER breaks the chat: falls back to JARVIS; the regex pre-check
 * result is honored by the caller regardless (spec Section 2).
 */
export async function classifyMessage({ text, audio }) {
  const isAudio = Boolean(audio?.buffer?.length);
  const parts = isAudio
    ? [
        { inlineData: { mimeType: audio.mimeType || 'audio/webm', data: audio.buffer.toString('base64') } },
        { text: 'Classify this voice message.' },
      ]
    : [{ text: String(text || '') }];

  try {
    const raw = await generateText({
      model: MODELS.router,
      system: isAudio ? ROUTER_PROMPT + ROUTER_AUDIO_ADDENDUM : ROUTER_PROMPT,
      contents: [{ role: 'user', parts }],
      temperature: 0,
      json: true,
      maxOutputTokens: isAudio ? 1024 : 256,
      label: 'router',
    });
    return parseRoute(raw, { fallbackLang: text ? guessLang(text) : 'ar' });
  } catch (err) {
    logger.error({ err: err.message }, 'router failed — defaulting to JARVIS (pre-check still applies)');
    return defaultRoute(text ? guessLang(text) : 'ar');
  }
}
