/**
 * Structural guard for the KB seed (M3 gate support): every entry must be fully
 * bilingual, psychoeducation-framed, and renderable by kbContextBlock.
 */
import { describe, it, expect } from 'vitest';
import { KB_SEED } from '../prisma/kbSeedData.js';
import { kbContextBlock } from '../src/services/kbService.js';

const SPEC_SLUGS = [
  'rumination',
  'contingent-self-worth',
  'cognitive-distortions',
  'burnout',
  'panic-cycle',
  'perfectionism-procrastination',
  'imposter-phenomenon',
  'sleep-hygiene',
  'boundaries-assertiveness',
  'grief-basics',
];

describe('KB seed data', () => {
  it('contains exactly the 10 spec entries', () => {
    expect(KB_SEED.map((e) => e.slug).sort()).toEqual([...SPEC_SLUGS].sort());
  });

  it.each(KB_SEED.map((e) => [e.slug, e]))('%s is fully bilingual and complete', (slug, e) => {
    expect(e.name_en.length).toBeGreaterThan(2);
    expect(e.name_ar).toMatch(/[؀-ۿ]/);
    expect(e.body_en.length).toBeGreaterThan(200);
    expect(e.body_ar).toMatch(/[؀-ۿ]/);
    expect(e.body_ar.length).toBeGreaterThan(150);
    expect(e.refer_when_en.length).toBeGreaterThan(10);
    expect(e.refer_when_ar).toMatch(/[؀-ۿ]/);
    expect(e.category.length).toBeGreaterThan(2);
    expect(Array.isArray(e.sources)).toBe(true);
    expect(e.sources.length).toBeGreaterThan(0);
    for (const s of e.sources) expect(s.url).toMatch(/^https:\/\//);

    const techniques = e.techniques.techniques;
    expect(techniques.length).toBeGreaterThanOrEqual(2);
    for (const t of techniques) {
      expect(t.name_en).toBeTruthy();
      expect(t.name_ar).toMatch(/[؀-ۿ]/);
      expect(t.how_en.length).toBeGreaterThan(20);
      expect(t.how_ar).toMatch(/[؀-ۿ]/);
    }
  });

  it('never uses diagnostic "you have X" framing (diagnosis guard, EN)', () => {
    for (const e of KB_SEED) {
      expect(e.body_en.toLowerCase()).not.toMatch(/you have (depression|anxiety|adhd|ocd|bipolar|ptsd)/);
      expect(e.body_ar).not.toMatch(/عندك (اكتئاب|قلق|وسواس)/);
    }
  });

  it('renders through kbContextBlock in both languages', () => {
    const mapped = KB_SEED.map((e) => ({
      slug: e.slug,
      nameEn: e.name_en,
      nameAr: e.name_ar,
      bodyEn: e.body_en,
      bodyAr: e.body_ar,
      techniques: e.techniques,
      referWhenEn: e.refer_when_en,
      referWhenAr: e.refer_when_ar,
    }));
    const ar = kbContextBlock(mapped.slice(0, 2), 'ar');
    const en = kbContextBlock(mapped.slice(0, 2), 'en');
    expect(ar).toContain('KNOWLEDGE BASE CONTEXT');
    expect(ar).toContain(KB_SEED[0].name_ar);
    expect(en).toContain(KB_SEED[0].name_en);
    expect(en).toContain('When to refer to a professional');
  });
});
