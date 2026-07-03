import { prisma } from '../lib/prisma.js';
import { searchFacts } from './memoryService.js';
import { searchKb, kbContextBlock } from './kbService.js';

export const L1_WINDOW = 12; // last messages included verbatim (spec Section 7)

/**
 * Context builder (spec Section 2 [3]):
 *   L1 last 12 messages · L2 top-8 memory facts · L3 rolling profile ·
 *   KB top-2 (if kb_query) · user settings.
 */
export async function buildContext({ user, session, route, userText }) {
  const [history, facts, kbEntries] = await Promise.all([
    prisma.message.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: L1_WINDOW,
      select: { role: true, content: true, persona: true },
    }),
    searchFacts(user.id, userText),
    route.kb_query ? searchKb(route.kb_query) : Promise.resolve([]),
  ]);

  const blocks = [];

  blocks.push(
    `USER SETTINGS: locale=${user.locale}, tars_honesty=${user.tarsHonesty}%, tars_humor=${user.tarsHumor}%.`
  );
  blocks.push(
    `ROUTER SIGNAL: emotion=${route.emotion}, intensity=${route.intensity}/5, detected_language=${route.lang}. Reply in that language (Egyptian Arabic when "ar").`
  );

  if (user.profile) {
    blocks.push(`LONG-TERM PROFILE (L3, rolling):\n${user.profile}`);
  }

  if (facts.length) {
    blocks.push(
      `LONG-TERM MEMORY FACTS (L2 — weave in naturally, never dump):\n${facts
        .map((f) => `- [${f.category}] ${f.fact}`)
        .join('\n')}`
    );
  }

  const kbBlock = kbContextBlock(kbEntries, route.lang);
  if (kbBlock) blocks.push(kbBlock);

  // Gemini wants chronological order, roles user|model
  const contents = history
    .reverse()
    .filter((m) => m.content)
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

  return { contextBlock: blocks.join('\n\n'), contents, kbUsed: kbEntries.map((e) => e.slug) };
}
