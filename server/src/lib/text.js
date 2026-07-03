/** Pure text helpers (unit-tested, no I/O). */

export const TTS_COMPRESS_THRESHOLD = 350;

export function shouldCompressForSpeech(text) {
  return String(text || '').length > TTS_COMPRESS_THRESHOLD;
}

/** Cut at the last sentence boundary before maxLen; hard-cut as a last resort. */
export function truncateAtSentence(text, maxLen = TTS_COMPRESS_THRESHOLD) {
  const s = String(text || '');
  if (s.length <= maxLen) return s;
  const slice = s.slice(0, maxLen);
  const boundary = Math.max(
    slice.lastIndexOf('.'),
    slice.lastIndexOf('؟'),
    slice.lastIndexOf('?'),
    slice.lastIndexOf('!'),
    slice.lastIndexOf('\n')
  );
  return boundary > maxLen * 0.4 ? slice.slice(0, boundary + 1).trim() : slice.trim();
}

/** Strip markdown decorations so TTS doesn't read asterisks aloud. */
export function stripMarkdown(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_#>`~]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract the first JSON object/array from LLM output (tolerates ``` fences and prose). */
export function extractJson(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(s);
  if (fence) s = fence[1].trim();
  try {
    return JSON.parse(s);
  } catch {
    const start = s.search(/[[{]/);
    if (start === -1) return null;
    for (let end = s.length; end > start; end--) {
      try {
        return JSON.parse(s.slice(start, end));
      } catch {
        /* keep shrinking */
      }
    }
    return null;
  }
}
