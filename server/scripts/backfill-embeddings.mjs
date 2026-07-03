/**
 * Backfill embeddings for rows inserted while GEMINI_API_KEY was absent:
 * kb_entries + memory_facts with embedding IS NULL.
 * Usage: npm run backfill:embeddings -w server
 */
import { prisma } from '../src/lib/prisma.js';
import { embedText, isGeminiConfigured } from '../src/lib/gemini.js';
import { vectorLiteral } from '../src/lib/vector.js';

async function main() {
  if (!isGeminiConfigured()) {
    console.error('GEMINI_API_KEY is required for backfill.');
    process.exit(1);
  }

  const kb = await prisma.$queryRawUnsafe(`SELECT id, name_en, body_en FROM kb_entries WHERE embedding IS NULL`);
  for (const row of kb) {
    const vec = vectorLiteral(await embedText(`${row.name_en}. ${row.body_en}`, { label: 'backfill:kb' }));
    await prisma.$executeRawUnsafe(`UPDATE kb_entries SET embedding = $1::vector WHERE id = $2::uuid`, vec, row.id);
    console.log(`✓ kb ${row.name_en}`);
  }

  const facts = await prisma.$queryRawUnsafe(`SELECT id, fact FROM memory_facts WHERE embedding IS NULL`);
  for (const row of facts) {
    const vec = vectorLiteral(await embedText(row.fact, { label: 'backfill:fact' }));
    await prisma.$executeRawUnsafe(`UPDATE memory_facts SET embedding = $1::vector WHERE id = $2::uuid`, vec, row.id);
    console.log(`✓ fact ${String(row.fact).slice(0, 60)}`);
  }

  console.log(`\nBackfilled ${kb.length} KB entries and ${facts.length} memory facts.`);
}

main()
  .catch((err) => {
    console.error('backfill failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
