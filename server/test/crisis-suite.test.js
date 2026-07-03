/**
 * M1 SAFETY GATE (spec Section 12 / 14.1) — runs in CI on every deploy, permanently.
 *
 * 20 Egyptian-Arabic crisis phrases MUST trigger the regex pre-check.
 * 20 English crisis phrases MUST trigger.
 * 20 benign phrases (including Egyptian idioms and English figures of speech
 * that *sound* lethal) MUST NOT trigger.
 *
 * Do not weaken a pattern to make a benign case pass — extend the benign case
 * list only with phrases that are unambiguously safe.
 */
import { describe, it, expect } from 'vitest';
import { crisisPrecheck, normalizeText } from '../src/safety/precheck.js';

const AR_CRISIS = [
  'عايز أموت',
  'نفسي أموت وأخلص',
  'بفكر في الانتحار جديًا',
  'هنتحر لو الموضوع كمل كده',
  'عايز أأذي نفسي',
  'النهارده اذيت نفسي تاني',
  'مش عايز أعيش خلاص',
  'مش عايزة أعيش في الدنيا دي',
  'هخلص على نفسي الليلة',
  'ناوي اقطع نفسي',
  'هموت نفسي وأريح الكل',
  'مفيش سبب أعيش',
  'مافيش أي سبب للحياة',
  'هضر نفسي لو فضلت كده',
  'عايز أرتاح من الدنيا',
  'هرتاح من الحياة دي خلاص',
  'قررت أنهي حياتي',
  'هرمي نفسي من البلكونة',
  'عايز أختفي خالص',
  'كان نفسي أموت من زمان',
];

const EN_CRISIS = [
  'I want to kill myself',
  "I've been thinking about suicide",
  'I feel suicidal tonight',
  'I keep thinking about self-harm',
  'I want to end it all',
  "I'm going to end my life",
  'I want to hurt myself',
  "There's no reason to live anymore",
  'no reason to keep living',
  'I want to die',
  'I just wanna die',
  'I wish I was dead',
  'everyone would be better off without me',
  "I'd be better off dead",
  "I don't want to be alive anymore",
  "I don't want to exist",
  "I'm planning to take my own life",
  "I've been cutting myself again",
  "Life isn't worth living",
  "I can't go on anymore",
];

const BENIGN = [
  // Egyptian idioms that pattern-match death words but are 100% safe
  'بموت في الكشري',
  'الديدلاين ده هيموتني',
  'موت من الضحك النهارده',
  'تعبان ومخنوق من الشغل',
  'عايز أنام بدري النهارده',
  'قتلت الوقت في مسلسلات',
  'الموبايل بتاعي مات خالص',
  'نفسي في إجازة أسبوع',
  'مش قادر أركز في المذاكرة',
  'زهقت من الروتين وعايز أغير شغلي',
  // English figures of speech
  'this deadline is killing me',
  "I'm dying to see that movie",
  'my phone died again',
  'I killed it in the interview today',
  "I'm dead tired after the gym",
  'that joke absolutely killed me',
  "let's kill some time before the meeting",
  "I'm overwhelmed with work this week",
  'my battery is about to die',
  "I feel a bit down today but I'll manage",
];

describe('M1 crisis pre-check — Arabic crisis phrases MUST trigger', () => {
  it.each(AR_CRISIS)('%s', (phrase) => {
    expect(crisisPrecheck(phrase).hit).toBe(true);
  });
});

describe('M1 crisis pre-check — English crisis phrases MUST trigger', () => {
  it.each(EN_CRISIS)('%s', (phrase) => {
    expect(crisisPrecheck(phrase).hit).toBe(true);
  });
});

describe('M1 crisis pre-check — benign phrases MUST NOT trigger', () => {
  it.each(BENIGN)('%s', (phrase) => {
    expect(crisisPrecheck(phrase).hit).toBe(false);
  });
});

describe('pre-check robustness (evasion via casing/punctuation/diacritics)', () => {
  it('catches uppercase', () => {
    expect(crisisPrecheck('I WANT TO KILL MYSELF').hit).toBe(true);
  });
  it('catches punctuation between words', () => {
    expect(crisisPrecheck('عايز...أموت!!').hit).toBe(true);
  });
  it('catches diacritics and tatweel', () => {
    expect(crisisPrecheck('عَايِز أَمُوت').hit).toBe(true);
    expect(crisisPrecheck('عـايز أمـوت').hit).toBe(true);
  });
  it('catches crisis phrase buried mid-sentence', () => {
    expect(crisisPrecheck('انا كنت كويس بس بصراحه بقيت مش عايز اعيش خلاص').hit).toBe(true);
    expect(crisisPrecheck('honestly after everything I just want to die, whatever').hit).toBe(true);
  });
  it('returns matched patterns for logging', () => {
    const r = crisisPrecheck('I want to kill myself');
    expect(r.matches.length).toBeGreaterThan(0);
  });
  it('empty/whitespace input never crashes and never triggers', () => {
    expect(crisisPrecheck('').hit).toBe(false);
    expect(crisisPrecheck('   ').hit).toBe(false);
    expect(crisisPrecheck(null).hit).toBe(false);
    expect(crisisPrecheck(undefined).hit).toBe(false);
  });
});

describe('normalizeText', () => {
  it('unifies alef forms and ta marbuta', () => {
    expect(normalizeText('أإآٱ')).toBe('اااا');
    expect(normalizeText('عايزة')).toBe('عايزه');
  });
  it('strips apostrophes so contractions match', () => {
    expect(normalizeText("isn't")).toBe('isnt');
  });
});
