/**
 * KB seeder (spec Section 6.3): `npm run db:seed -w server`.
 * Idempotent — upserts by slug, so content edits re-seed safely.
 * Embeds with text-embedding-004 when GEMINI_API_KEY is set; otherwise inserts
 * without embeddings (keyword fallback still works) — run backfill-embeddings later.
 */
import { prisma } from '../src/lib/prisma.js';
import { embedText, isEmbeddingConfigured } from '../src/lib/embeddings.js';
import { vectorLiteral } from '../src/lib/vector.js';
import { KB_SEED } from './kbSeedData.js';

async function main() {
  let embedded = 0;
  for (const entry of KB_SEED) {
    const data = {
      category: entry.category,
      nameEn: entry.name_en,
      nameAr: entry.name_ar,
      bodyEn: entry.body_en,
      bodyAr: entry.body_ar,
      techniques: entry.techniques,
      referWhenEn: entry.refer_when_en,
      referWhenAr: entry.refer_when_ar,
      sources: entry.sources,
    };
    await prisma.kbEntry.upsert({
      where: { slug: entry.slug },
      create: { slug: entry.slug, ...data },
      update: data,
    });

    if (isEmbeddingConfigured()) {
      const vec = vectorLiteral(await embedText(`${entry.name_en}. ${entry.body_en}`, { label: 'embed:kbseed' }));
      await prisma.$executeRawUnsafe(`UPDATE kb_entries SET embedding = $1::vector WHERE slug = $2`, vec, entry.slug);
      embedded += 1;
    }
    console.log(`✓ ${entry.slug}`);
  }

  console.log(`\nSeeded ${KB_SEED.length} KB entries (${embedded} embedded).`);
  if (!isEmbeddingConfigured()) {
    console.log('No embedding provider configured — run `npm run backfill:embeddings -w server` later to enable vector retrieval.');
  }
}

main()
  .catch((err) => {
    console.error('seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
