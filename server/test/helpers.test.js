/** Pure helper coverage: text utils, pgvector literals, HMAC, TTS budget policy. */
import { describe, it, expect } from 'vitest';
import { extractJson, truncateAtSentence, stripMarkdown, shouldCompressForSpeech, TTS_COMPRESS_THRESHOLD } from '../src/lib/text.js';
import { vectorLiteral, cosineSim } from '../src/lib/vector.js';
import { signBody, verifySignature } from '../src/lib/hmac.js';
import { budgetDecision, CREDITS_PER_CHAR } from '../src/services/ttsService.js';
import { getCrisisResources } from '../src/config/crisisResources.js';

describe('extractJson', () => {
  it('parses plain JSON', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });
  it('parses fenced JSON with prose', () => {
    expect(extractJson('here:\n```json\n[{"fact":"x"}]\n```')).toEqual([{ fact: 'x' }]);
  });
  it('recovers the object embedded in trailing prose', () => {
    expect(extractJson('result {"a":[1,2]} thanks')).toEqual({ a: [1, 2] });
  });
  it('returns null for hopeless input', () => {
    expect(extractJson('no json here')).toBe(null);
    expect(extractJson(null)).toBe(null);
  });
});

describe('speech text helpers', () => {
  it('compression threshold honors the 350-char spec limit', () => {
    expect(shouldCompressForSpeech('x'.repeat(TTS_COMPRESS_THRESHOLD))).toBe(false);
    expect(shouldCompressForSpeech('x'.repeat(TTS_COMPRESS_THRESHOLD + 1))).toBe(true);
  });
  it('truncates at a sentence boundary (Arabic question mark too)', () => {
    const s = 'الجملة الأولى؟ '.repeat(40);
    const out = truncateAtSentence(s);
    expect(out.length).toBeLessThanOrEqual(TTS_COMPRESS_THRESHOLD);
    expect(out.endsWith('؟')).toBe(true);
  });
  it('stripMarkdown removes decorations and code blocks', () => {
    expect(stripMarkdown('**bold** and `code` and [link](http://x)')).toBe('bold and code and link');
    expect(stripMarkdown('before\n```js\nlet x=1;\n```\nafter')).toBe('before after');
  });
});

describe('vectorLiteral', () => {
  it('serializes to a pgvector literal', () => {
    expect(vectorLiteral([0.1, -2, 3])).toBe('[0.1,-2,3]');
  });
  it('throws on non-finite values (SQL-injection guard)', () => {
    expect(() => vectorLiteral([1, NaN])).toThrow();
    expect(() => vectorLiteral([1, Infinity])).toThrow();
    expect(() => vectorLiteral(['1; DROP TABLE users'])).toThrow();
    expect(() => vectorLiteral([])).toThrow();
  });
});

describe('cosineSim', () => {
  it('is 1 for identical, 0 for orthogonal, 0 for zero vector', () => {
    expect(cosineSim([1, 2], [1, 2])).toBeCloseTo(1);
    expect(cosineSim([1, 0], [0, 1])).toBeCloseTo(0);
    expect(cosineSim([0, 0], [1, 1])).toBe(0);
  });
});

describe('HMAC metrics signature', () => {
  const secret = 'shared-secret';
  const body = Buffer.from('{"email":"a@b.c","source":"github","metric":"commits","value":4}');

  it('accepts a valid signature (with and without sha256= prefix)', () => {
    const sig = signBody(body, secret);
    expect(verifySignature(body, sig, secret)).toBe(true);
    expect(verifySignature(body, `sha256=${sig}`, secret)).toBe(true);
  });
  it('rejects tampered body, wrong secret, malformed or missing signatures', () => {
    const sig = signBody(body, secret);
    expect(verifySignature(Buffer.from('{"email":"evil"}'), sig, secret)).toBe(false);
    expect(verifySignature(body, signBody(body, 'other'), secret)).toBe(false);
    expect(verifySignature(body, 'zz-not-hex', secret)).toBe(false);
    expect(verifySignature(body, '', secret)).toBe(false);
    expect(verifySignature(body, sig, '')).toBe(false);
  });
});

describe('TTS budget guard (spec Section 9)', () => {
  const budget = 10_000; // credits; 0.5 credits/char

  it('allows well under budget without warning', () => {
    const d = budgetDecision({ used: 0, budget, textLength: 200 });
    expect(d).toMatchObject({ allowed: true, warn: false, cost: 200 * CREDITS_PER_CHAR });
  });
  it('warns at >= 80% of budget', () => {
    const d = budgetDecision({ used: budget * 0.8 - 10, budget, textLength: 100 });
    expect(d.allowed).toBe(true);
    expect(d.warn).toBe(true);
  });
  it('blocks when the request would exceed 100%', () => {
    const d = budgetDecision({ used: budget - 20, budget, textLength: 100 });
    expect(d.allowed).toBe(false);
  });
  it('blocks entirely on zero budget', () => {
    expect(budgetDecision({ used: 0, budget: 0, textLength: 10 }).allowed).toBe(false);
  });
});

describe('crisis resources config (compliance, spec Section 0.6)', () => {
  it('loads with bilingual copy and at least one resource', () => {
    const cfg = getCrisisResources();
    expect(cfg.title_ar).toBeTruthy();
    expect(cfg.title_en).toBeTruthy();
    expect(cfg.advice_ar).toContain('دلوقتي');
    expect(Array.isArray(cfg.resources)).toBe(true);
    expect(cfg.resources.length).toBeGreaterThan(0);
    for (const r of cfg.resources) {
      expect(r.phone).toBeTruthy();
      expect(r.name_ar).toBeTruthy();
      expect(r.name_en).toBeTruthy();
    }
  });
});
