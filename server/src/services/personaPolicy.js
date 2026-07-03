/**
 * Pure persona routing policy — unit-tested (spec Section 14.2).
 * The LLM router *suggests*; this module *enforces*:
 *   - crisis always wins
 *   - post-crisis lockout forces CASE
 *   - intensity >= 4 can never reach TARS/FRIDAY/JARVIS (CASE takes over)
 */
import { extractJson } from '../lib/text.js';
import { normalizeArabic } from '../safety/precheck.js';

export const PERSONAS = ['JARVIS', 'FRIDAY', 'TARS', 'CASE'];

export function guessLang(text) {
  return /[؀-ۿ]/.test(String(text || '')) ? 'ar' : 'en';
}

export function defaultRoute(lang = 'ar') {
  return { persona: 'JARVIS', emotion: 'neutral', intensity: 2, crisis: false, kb_query: null, lang };
}

/** Parse + sanitize the router's JSON output. Never throws — falls back to JARVIS (spec Section 2). */
export function parseRoute(raw, { fallbackLang = 'ar' } = {}) {
  const data = typeof raw === 'object' && raw !== null ? raw : extractJson(raw);
  if (!data || typeof data !== 'object') return defaultRoute(fallbackLang);

  const persona = PERSONAS.includes(data.persona) ? data.persona : 'JARVIS';
  let intensity = Number(data.intensity);
  if (!Number.isFinite(intensity)) intensity = 2;
  intensity = Math.min(5, Math.max(1, Math.round(intensity)));

  return {
    persona,
    emotion: typeof data.emotion === 'string' && data.emotion ? data.emotion.slice(0, 40) : 'neutral',
    intensity,
    crisis: data.crisis === true,
    kb_query: typeof data.kb_query === 'string' && data.kb_query.trim() ? data.kb_query.trim().slice(0, 200) : null,
    lang: data.lang === 'en' ? 'en' : data.lang === 'ar' ? 'ar' : fallbackLang,
    transcript: typeof data.transcript === 'string' ? data.transcript : undefined,
  };
}

/**
 * Final persona decision.
 * @returns 'CRISIS' | 'CASE' | 'JARVIS' | 'FRIDAY' | 'TARS'
 */
export function resolvePersona(route, { locked = false } = {}) {
  if (route.crisis) return 'CRISIS';
  if (locked) return 'CASE'; // post-crisis: personas disabled until 3 calm messages
  if (route.intensity >= 4) return 'CASE'; // TARS/FRIDAY/JARVIS must never fire at intensity >= 4
  return PERSONAS.includes(route.persona) ? route.persona : 'JARVIS';
}

/**
 * "TARS: humor 40" / "تارس: هزار 40" style runtime commands (spec 5.4).
 * @returns {null | {setting: 'tarsHonesty'|'tarsHumor', value: number}}
 */
export function parseTarsCommand(text) {
  const n = normalizeArabic(String(text || '').toLowerCase()).trim();
  const m = /^(?:tars|تارس)\s*[:،,]?\s*(honesty|humor|humour|صراحه|جديه|هزار|مزاح)\s*[:=]?\s*(\d{1,3})\s*%?$/i.exec(n);
  if (!m) return null;
  const value = Math.min(100, Math.max(0, parseInt(m[2], 10)));
  const isHumor = ['humor', 'humour', 'هزار', 'مزاح'].includes(m[1]);
  return { setting: isHumor ? 'tarsHumor' : 'tarsHonesty', value };
}
