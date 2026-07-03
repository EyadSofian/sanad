import { prisma } from '../lib/prisma.js';
import { embedText, isGeminiConfigured } from '../lib/gemini.js';
import { vectorLiteral } from '../lib/vector.js';
import { logger } from '../lib/logger.js';

/**
 * KB retrieval (spec Section 6.1): router's kb_query (English) → embed → cosine top-2.
 * Fallback when embeddings are unavailable: cheap keyword scoring over the (small) KB.
 * Always returns [] on failure — KB is enrichment, never a blocker.
 */
export async function searchKb(kbQuery, { limit = 2 } = {}) {
  if (!kbQuery) return [];
  try {
    if (isGeminiConfigured()) {
      const emb = await embedText(kbQuery, { label: 'embed:kbquery' });
      const vec = vectorLiteral(emb);
      const rows = await prisma.$queryRawUnsafe(
        `SELECT id, slug, category, name_en, name_ar, body_en, body_ar,
                techniques, refer_when_en, refer_when_ar,
                1 - (embedding <=> $1::vector) AS sim
           FROM kb_entries
          WHERE embedding IS NOT NULL
          ORDER BY embedding <=> $1::vector
          LIMIT ${Number(limit)}`,
        vec
      );
      if (rows.length > 0) return rows.filter((r) => Number(r.sim) > 0.35).map(mapRow);
    }
    return await keywordFallback(kbQuery, limit);
  } catch (err) {
    logger.warn({ err: err.message, kbQuery }, 'kb search failed — continuing without KB');
    return [];
  }
}

async function keywordFallback(kbQuery, limit) {
  const entries = await prisma.kbEntry.findMany();
  const words = kbQuery.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  if (!words.length) return [];
  const scored = entries
    .map((e) => {
      const hay = `${e.slug} ${e.nameEn} ${e.bodyEn}`.toLowerCase();
      const score = words.reduce((acc, w) => acc + (hay.includes(w) ? 1 : 0), 0);
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map(({ e }) => ({
    slug: e.slug,
    nameEn: e.nameEn,
    nameAr: e.nameAr,
    bodyEn: e.bodyEn,
    bodyAr: e.bodyAr,
    techniques: e.techniques,
    referWhenEn: e.referWhenEn,
    referWhenAr: e.referWhenAr,
  }));
}

function mapRow(r) {
  return {
    slug: r.slug,
    nameEn: r.name_en,
    nameAr: r.name_ar,
    bodyEn: r.body_en,
    bodyAr: r.body_ar,
    techniques: r.techniques,
    referWhenEn: r.refer_when_en,
    referWhenAr: r.refer_when_ar,
  };
}

/** Render KB entries as psychoeducation context for the model (Core Rule 2). */
export function kbContextBlock(entries, lang) {
  if (!entries?.length) return '';
  const parts = entries.map((e) => {
    const name = lang === 'ar' ? `${e.nameAr} — ${e.nameEn}` : `${e.nameEn} (${e.nameAr})`;
    const body = lang === 'ar' ? e.bodyAr : e.bodyEn;
    const refer = lang === 'ar' ? e.referWhenAr : e.referWhenEn;
    const techniques = (e.techniques?.techniques || e.techniques || [])
      .map((t) => {
        const tname = lang === 'ar' ? t.name_ar || t.name_en : t.name_en || t.name_ar;
        const how = lang === 'ar' ? t.how_ar || t.how_en || t.how : t.how_en || t.how || t.how_ar;
        return `  • ${tname}: ${how}`;
      })
      .join('\n');
    return `## ${name}\n${body}\nEvidence-based techniques:\n${techniques}\nWhen to refer to a professional: ${refer}`;
  });
  return `KNOWLEDGE BASE CONTEXT (psychoeducation — apply Core Rule 2; patterns, NEVER diagnoses):\n${parts.join('\n\n')}`;
}
