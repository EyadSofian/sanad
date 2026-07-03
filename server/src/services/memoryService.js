import { prisma } from '../lib/prisma.js';
import { embedText, isGeminiConfigured } from '../lib/gemini.js';
import { vectorLiteral } from '../lib/vector.js';
import { logger } from '../lib/logger.js';

export const DEDUPE_THRESHOLD = 0.92; // cosine similarity (spec Section 7 L2)
export const RECENCY_HALF_LIFE_DAYS = 30;

/**
 * L2 retrieval: top-8 facts by cosine(query_emb) × salience, recency-weighted (spec Section 2 [3]).
 * Returns [] on any failure — memory must never break a chat turn.
 */
export async function searchFacts(userId, queryText, { limit = 8 } = {}) {
  if (!isGeminiConfigured()) return [];
  try {
    const emb = await embedText(queryText.slice(0, 2000), { label: 'embed:memquery' });
    const vec = vectorLiteral(emb);
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, fact, category, salience, last_seen,
              1 - (embedding <=> $1::vector) AS sim
         FROM memory_facts
        WHERE user_id = $2::uuid AND embedding IS NOT NULL
        ORDER BY (1 - (embedding <=> $1::vector))
                 * salience
                 * exp(-EXTRACT(EPOCH FROM (now() - last_seen)) / 86400.0 / ${RECENCY_HALF_LIFE_DAYS})
                 DESC
        LIMIT ${Number(limit)}`,
      vec,
      userId
    );
    return rows.filter((r) => Number(r.sim) > 0.25);
  } catch (err) {
    logger.warn({ err: err.message }, 'memory search failed — continuing without L2');
    return [];
  }
}

/**
 * Insert a fact with dedupe: nearest neighbour > 0.92 → bump salience + last_seen
 * instead of inserting (spec Section 7).
 */
export async function upsertFact(userId, { fact, category, sourceMessageId = null }) {
  const emb = await embedText(fact, { label: 'embed:fact' });
  const vec = vectorLiteral(emb);

  const nearest = await prisma.$queryRawUnsafe(
    `SELECT id, 1 - (embedding <=> $1::vector) AS sim
       FROM memory_facts
      WHERE user_id = $2::uuid AND embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 1`,
    vec,
    userId
  );

  if (nearest.length && Number(nearest[0].sim) > DEDUPE_THRESHOLD) {
    await prisma.$executeRawUnsafe(
      `UPDATE memory_facts
          SET salience = LEAST(salience + 0.25, 3.0), last_seen = now()
        WHERE id = $1::uuid`,
      nearest[0].id
    );
    return { deduped: true, id: nearest[0].id };
  }

  const inserted = await prisma.$queryRawUnsafe(
    `INSERT INTO memory_facts (user_id, fact, category, embedding, salience, last_seen, source_message)
     VALUES ($1::uuid, $2, $3, $4::vector, 1.0, now(), $5::uuid)
     RETURNING id`,
    userId,
    fact,
    category,
    vec,
    sourceMessageId
  );
  return { deduped: false, id: inserted[0]?.id };
}

/** Weekly decay: salience *= 0.98; delete < 0.2 except category='patterns' (spec Section 7). */
export async function decayFacts() {
  const updated = await prisma.$executeRawUnsafe(`UPDATE memory_facts SET salience = salience * 0.98`);
  const deleted = await prisma.$executeRawUnsafe(
    `DELETE FROM memory_facts WHERE salience < 0.2 AND category <> 'patterns'`
  );
  logger.info({ updated, deleted }, 'memory decay pass done');
  return { updated, deleted };
}

export async function listFacts(userId) {
  return prisma.memoryFact.findMany({
    where: { userId },
    select: { id: true, fact: true, category: true, salience: true, lastSeen: true },
    orderBy: { salience: 'desc' },
    take: 500,
  });
}

export async function deleteFact(userId, factId) {
  const { count } = await prisma.memoryFact.deleteMany({ where: { id: factId, userId } });
  return count > 0;
}

export async function topFactsForProfile(userId, limit = 40) {
  return prisma.memoryFact.findMany({
    where: { userId },
    select: { fact: true, category: true, salience: true },
    orderBy: [{ salience: 'desc' }, { lastSeen: 'desc' }],
    take: limit,
  });
}
