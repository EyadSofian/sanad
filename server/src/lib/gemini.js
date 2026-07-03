import { GoogleGenAI } from '@google/genai';
import { env, requireEnv } from '../config/env.js';
import { logger } from './logger.js';

export const MODELS = {
  main: 'gemini-2.5-flash',
  router: 'gemini-2.5-flash-lite',
  embed: 'text-embedding-004',
};

let client = null;
function ai() {
  if (!client) {
    requireEnv('GEMINI_API_KEY');
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return client;
}

// ---- circuit breaker (per-process) ----
const OPEN_AFTER_FAILURES = 5;
const HALF_OPEN_AFTER_MS = 30_000;
const breaker = { failures: 0, openedAt: 0 };

function breakerGate() {
  if (breaker.failures >= OPEN_AFTER_FAILURES && Date.now() - breaker.openedAt < HALF_OPEN_AFTER_MS) {
    const err = new Error('Gemini circuit breaker is open');
    err.code = 'CIRCUIT_OPEN';
    throw err;
  }
}
function breakerOk() {
  breaker.failures = 0;
}
function breakerFail() {
  breaker.failures += 1;
  breaker.openedAt = Date.now();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    if (typeof timer.unref === 'function') timer.unref();
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** retry x3, exponential backoff + jitter, 30s timeout, circuit breaker — spec Section 2. */
export async function withRetry(fn, { retries = 3, timeoutMs = 30_000, label = 'gemini' } = {}) {
  breakerGate();
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await withTimeout(fn(), timeoutMs, label);
      breakerOk();
      return result;
    } catch (err) {
      lastErr = err;
      breakerFail();
      if (attempt < retries) {
        const delay = Math.min(8000, 500 * 2 ** attempt) + Math.random() * 300;
        logger.warn({ label, attempt, err: err.message }, 'gemini call failed — retrying');
        await sleep(delay);
      }
    }
  }
  throw lastErr;
}

/**
 * Non-streaming text generation.
 * @param {object} o
 * @param {string} [o.model]
 * @param {string} [o.system] systemInstruction text
 * @param {Array}  o.contents Gemini contents array [{role, parts}]
 * @param {number} [o.temperature]
 * @param {boolean} [o.json] force application/json response
 * @param {number} [o.maxOutputTokens]
 */
export async function generateText({
  model = MODELS.main,
  system,
  contents,
  temperature = 0.7,
  json = false,
  maxOutputTokens = 2048,
  timeoutMs = 30_000,
  label = 'generate',
}) {
  const response = await withRetry(
    () =>
      ai().models.generateContent({
        model,
        contents,
        config: {
          ...(system ? { systemInstruction: system } : {}),
          temperature,
          maxOutputTokens,
          ...(json ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    { label: `${label}:${model}`, timeoutMs }
  );
  return response.text ?? '';
}

/**
 * Streaming generation. Retries only the stream *initiation*; mid-stream failures
 * surface to the caller (which emits an SSE error event).
 * @returns async iterable of text chunks
 */
export async function generateStream({
  model = MODELS.main,
  system,
  contents,
  temperature = 0.7,
  maxOutputTokens = 2048,
  label = 'stream',
}) {
  const stream = await withRetry(
    () =>
      ai().models.generateContentStream({
        model,
        contents,
        config: {
          ...(system ? { systemInstruction: system } : {}),
          temperature,
          maxOutputTokens,
        },
      }),
    { label: `${label}:${model}` }
  );
  async function* chunks() {
    for await (const part of stream) {
      const text = part.text;
      if (text) yield text;
    }
  }
  return chunks();
}

/** Embed a single text with text-embedding-004 → number[768]. */
export async function embedText(text, { label = 'embed' } = {}) {
  const response = await withRetry(
    () => ai().models.embedContent({ model: MODELS.embed, contents: text }),
    { label, timeoutMs: 15_000 }
  );
  const values =
    response?.embeddings?.[0]?.values ?? response?.embedding?.values ?? null;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('embedContent returned no embedding values');
  }
  return values;
}

export function isGeminiConfigured() {
  return Boolean(env.GEMINI_API_KEY);
}
