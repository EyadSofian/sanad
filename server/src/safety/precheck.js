/**
 * SANAD crisis pre-check — layer 1 of the safety system (Section 4 of the spec).
 *
 * Pure, synchronous, zero-LLM. Runs on EVERY inbound message before anything else.
 * The LLM router is layer 2 and catches nuanced phrasing; this layer guarantees
 * that explicit self-harm language can never slip through a router failure.
 *
 * Design rule: fail-safe. A rare false positive shows support resources — cheap.
 * A false negative is unacceptable. Patterns are phrase-anchored to avoid firing
 * on Egyptian idioms like "بموت في الكشري" or "this deadline is killing me".
 */

/** Normalize Arabic script: strip diacritics/tatweel, unify alef/ya/ta-marbuta forms. */
export function normalizeArabic(s) {
  return s
    .replace(/[ً-ْٰ]/g, '') // harakat
    .replace(/ـ/g, '') // tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه');
}

/** Lowercase, strip apostrophes, turn other punctuation into spaces, collapse whitespace. */
export function normalizeText(s) {
  return normalizeArabic(String(s || '').toLowerCase())
    .replace(/[’'`]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Applied to normalizeText() output. Keep each pattern tight and phrase-anchored.
export const AR_CRISIS_PATTERNS = [
  /(عايز|عايزه|عاوز|عاوزه|نفسي)\s+(اني\s+)?اموت/, // عايز أموت / نفسي أموت
  /انتحار|نتحر/, // انتحر، هنتحر، الانتحار، منتحر
  /(ا?اذي|اذيت|هاذي|ايذاء)\s+(في\s+)?نفسي/, // أأذي نفسي / اذيت نفسي
  /مش\s+(عايز|عايزه|عاوز|عاوزه)\s+اعيش/, // مش عايز أعيش
  /(هخلص|اخلص|خلصت)\s+علي\s+نفسي/, // هخلص على نفسي
  /(اقطع|بقطع|هقطع|قطعت)\s+(في\s+)?نفسي/, // اقطع نفسي
  /(هموت|اموت|بموت|موت)\s+نفسي/, // هموت نفسي
  /(مفيش|مافيش|ما\s+فيش|ملقيتش)\s+(اي\s+)?سبب\s+(اني\s+)?(اعيش|للعيش|للحياه)/, // مفيش سبب أعيش
  /(اضر|هضر|ضررت)\s+نفسي/, // أضر نفسي
  /(اخلص|ارتاح|هرتاح)\s+من\s+(الدنيا|الحياه|حياتي)/, // أرتاح من الدنيا
  /(انهي|هنهي|انهاء)\s+حياتي/, // أنهي حياتي
  /(القي|ارمي|هرمي|هلقي)\s+(ب?نفسي)\s+من/, // أرمي نفسي من...
  /عايز(ه)?\s+اختفي\s+خالص|نفسي\s+اختفي\s+خالص/, // عايز أختفي خالص
];

export const EN_CRISIS_PATTERNS = [
  /kill(ing|ed)?\s+myself/,
  /\bsuicid(e|al|ing)?\b/,
  /self[\s-]?harm/,
  /end(ing)?\s+it\s+all|end(ing)?\s+my\s+life/,
  /hurt(ing)?\s+myself/,
  /no\s+reason\s+to\s+(live|keep\s+living|go\s+on)/,
  /want(ed)?\s+to\s+die|wanna\s+die|wish\s+i\s+(was|were)\s+dead/,
  /better\s+off\s+dead|better\s+off\s+without\s+me/,
  /don?t\s+want\s+to\s+(live|be\s+alive|exist)/,
  /take\s+my\s+(own\s+)?life/,
  /cut(ting)?\s+myself/,
  /harm(ing)?\s+myself/,
  /isnt\s+worth\s+living|not\s+worth\s+living/,
  /cant\s+go\s+on\s+anymore/,
  /\boverdose\b/,
];

/**
 * @param {string} text raw user text (or transcript of a voice message)
 * @returns {{hit: boolean, matches: string[]}}
 */
export function crisisPrecheck(text) {
  const n = normalizeText(text);
  if (!n) return { hit: false, matches: [] };
  const matches = [];
  for (const re of [...AR_CRISIS_PATTERNS, ...EN_CRISIS_PATTERNS]) {
    const m = re.exec(n);
    if (m) matches.push(m[0]);
  }
  return { hit: matches.length > 0, matches };
}
