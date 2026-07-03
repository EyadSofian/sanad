/**
 * Persona-leakage rules (spec Section 14.2) — the *enforced* half.
 * TARS/FRIDAY/JARVIS must never fire at intensity >= 4; crisis always wins;
 * post-crisis lockout forces CASE.
 */
import { describe, it, expect } from 'vitest';
import { parseRoute, resolvePersona, defaultRoute, parseTarsCommand, guessLang } from '../src/services/personaPolicy.js';

describe('resolvePersona — leakage gates', () => {
  it('crisis=true always resolves to CRISIS, whatever the router suggested', () => {
    for (const persona of ['JARVIS', 'FRIDAY', 'TARS', 'CASE']) {
      expect(resolvePersona({ persona, intensity: 1, crisis: true })).toBe('CRISIS');
    }
  });

  it('TARS can NEVER fire at intensity >= 4', () => {
    expect(resolvePersona({ persona: 'TARS', intensity: 4, crisis: false })).toBe('CASE');
    expect(resolvePersona({ persona: 'TARS', intensity: 5, crisis: false })).toBe('CASE');
  });

  it('FRIDAY and JARVIS also yield to CASE at intensity >= 4', () => {
    expect(resolvePersona({ persona: 'FRIDAY', intensity: 4, crisis: false })).toBe('CASE');
    expect(resolvePersona({ persona: 'JARVIS', intensity: 5, crisis: false })).toBe('CASE');
  });

  it('post-crisis lockout forces CASE regardless of router persona', () => {
    expect(resolvePersona({ persona: 'TARS', intensity: 1, crisis: false }, { locked: true })).toBe('CASE');
    expect(resolvePersona({ persona: 'FRIDAY', intensity: 2, crisis: false }, { locked: true })).toBe('CASE');
  });

  it('below intensity 4 and unlocked, the router persona is honored', () => {
    expect(resolvePersona({ persona: 'TARS', intensity: 3, crisis: false })).toBe('TARS');
    expect(resolvePersona({ persona: 'FRIDAY', intensity: 2, crisis: false })).toBe('FRIDAY');
  });

  it('unknown persona falls back to JARVIS', () => {
    expect(resolvePersona({ persona: 'HAL9000', intensity: 2, crisis: false })).toBe('JARVIS');
  });
});

describe('parseRoute — never throws, always sane', () => {
  it('parses clean router JSON', () => {
    const r = parseRoute('{"persona":"FRIDAY","emotion":"focused","intensity":2,"crisis":false,"kb_query":null,"lang":"ar"}');
    expect(r).toMatchObject({ persona: 'FRIDAY', emotion: 'focused', intensity: 2, crisis: false, lang: 'ar' });
  });

  it('parses JSON wrapped in markdown fences with prose around it', () => {
    const raw = 'Sure! Here is the classification:\n```json\n{"persona":"TARS","emotion":"doubt","intensity":3,"crisis":false,"kb_query":"imposter syndrome","lang":"en"}\n```\nHope this helps.';
    const r = parseRoute(raw);
    expect(r.persona).toBe('TARS');
    expect(r.kb_query).toBe('imposter syndrome');
  });

  it('garbage falls back to the JARVIS default route', () => {
    expect(parseRoute('not json at all', { fallbackLang: 'en' })).toEqual(defaultRoute('en'));
    expect(parseRoute('', { fallbackLang: 'ar' })).toEqual(defaultRoute('ar'));
    expect(parseRoute(null)).toEqual(defaultRoute('ar'));
  });

  it('clamps intensity into 1–5 and rounds', () => {
    expect(parseRoute('{"persona":"JARVIS","intensity":99}').intensity).toBe(5);
    expect(parseRoute('{"persona":"JARVIS","intensity":-3}').intensity).toBe(1);
    expect(parseRoute('{"persona":"JARVIS","intensity":2.6}').intensity).toBe(3);
    expect(parseRoute('{"persona":"JARVIS","intensity":"high"}').intensity).toBe(2);
  });

  it('crisis only true on boolean true (never truthy strings)', () => {
    expect(parseRoute('{"persona":"JARVIS","crisis":"false"}').crisis).toBe(false);
    expect(parseRoute('{"persona":"JARVIS","crisis":true}').crisis).toBe(true);
  });

  it('kb_query: empty/whitespace → null, long queries truncated', () => {
    expect(parseRoute('{"persona":"JARVIS","kb_query":"  "}').kb_query).toBe(null);
    expect(parseRoute(`{"persona":"JARVIS","kb_query":"${'x'.repeat(500)}"}`).kb_query?.length).toBe(200);
  });
});

describe('parseTarsCommand — runtime slider commands', () => {
  it('parses English forms', () => {
    expect(parseTarsCommand('TARS: humor 40')).toEqual({ setting: 'tarsHumor', value: 40 });
    expect(parseTarsCommand('tars honesty 95')).toEqual({ setting: 'tarsHonesty', value: 95 });
  });
  it('parses Arabic forms', () => {
    expect(parseTarsCommand('تارس: هزار 70')).toEqual({ setting: 'tarsHumor', value: 70 });
    expect(parseTarsCommand('تارس صراحة 80')).toEqual({ setting: 'tarsHonesty', value: 80 });
  });
  it('clamps to 0–100', () => {
    expect(parseTarsCommand('TARS humor 250')).toEqual({ setting: 'tarsHumor', value: 100 });
  });
  it('ignores ordinary sentences mentioning TARS', () => {
    expect(parseTarsCommand('I think TARS was too harsh yesterday')).toBe(null);
    expect(parseTarsCommand('نظملي يومي بكرة')).toBe(null);
  });
});

describe('guessLang', () => {
  it('detects Arabic script', () => {
    expect(guessLang('ازيك يا هندسة')).toBe('ar');
    expect(guessLang('hello there')).toBe('en');
    expect(guessLang('')).toBe('en');
  });
});
