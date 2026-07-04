/**
 * L3 rolling profile (spec Section 7): nightly, ~300 words from top-salience facts,
 * stored on users.profile and injected into every chat context.
 */
import { prisma } from '../lib/prisma.js';
import { generateUtilityText, isUtilityLlmConfigured } from '../lib/llm.js';
import { PROFILE_PROMPT } from '../prompts/prompts.js';
import { topFactsForProfile } from '../services/memoryService.js';
import { logger } from '../lib/logger.js';

const MIN_FACTS = 3; // below this a "profile" is just noise
const PROFILE_CHAR_CAP = 2500;

export async function rebuildProfiles() {
  if (!isUtilityLlmConfigured()) {
    logger.warn('GEMINI_API_KEY missing — skipping profile rebuild');
    return { rebuilt: 0 };
  }

  const grouped = await prisma.memoryFact.groupBy({
    by: ['userId'],
    _count: { _all: true },
  });
  const userIds = grouped.filter((g) => g._count._all >= MIN_FACTS).map((g) => g.userId);

  let rebuilt = 0;
  for (const userId of userIds) {
    try {
      const facts = await topFactsForProfile(userId, 40);
      const factList = facts.map((f) => `- [${f.category}] ${f.fact}`).join('\n');
      const profile = await generateUtilityText({
        system: PROFILE_PROMPT,
        contents: [{ role: 'user', parts: [{ text: `MEMORY FACTS:\n${factList}` }] }],
        temperature: 0.3,
        maxOutputTokens: 768,
        label: 'profile',
      });
      if (profile?.trim()) {
        await prisma.user.update({
          where: { id: userId },
          data: { profile: profile.trim().slice(0, PROFILE_CHAR_CAP) },
        });
        rebuilt += 1;
      }
    } catch (err) {
      logger.error({ userId, err: err.message }, 'profile rebuild failed for user');
    }
  }

  logger.info({ candidates: userIds.length, rebuilt }, 'profile rebuild done');
  return { rebuilt };
}
