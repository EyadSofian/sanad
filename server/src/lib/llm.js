/**
 * Main-generation LLM abstraction.
 *
 * The persona replies (and the weekly digest) can run on Gemini (default),
 * OpenAI, or Anthropic — picked via LLM_PROVIDER + *_MODEL env vars.
 * Everything safety-critical or cost-critical stays pinned to Gemini:
 * router/classifier, crisis pre-check path, embeddings, audio transcription.
 *
 * Contract mirrors lib/gemini.js: contents are Gemini-style
 * [{role: 'user'|'model', parts: [{text}]}] and are converted per provider.
 */
import { env } from '../config/env.js';
import { generateText as geminiGenerateText, generateStream as geminiGenerateStream, withRetry, MODELS } from './gemini.js';
import { logger } from './logger.js';

const DEFAULT_MODELS = {
  gemini: MODELS.main,
  openai: 'gpt-5-mini',
  anthropic: 'claude-opus-4-8',
};

function activeProvider() {
  const p = env.LLM_PROVIDER;
  if (p === 'openai' && env.OPENAI_API_KEY) return 'openai';
  if (p === 'anthropic' && env.ANTHROPIC_API_KEY) return 'anthropic';
  if ((p === 'openai' || p === 'anthropic') && env.isProd) {
    logger.warn({ provider: p }, 'LLM_PROVIDER set but its API key is missing — falling back to gemini');
  }
  return 'gemini';
}

export function getEngineInfo() {
  const provider = activeProvider();
  const model =
    provider === 'openai'
      ? env.OPENAI_MODEL || DEFAULT_MODELS.openai
      : provider === 'anthropic'
        ? env.ANTHROPIC_MODEL || DEFAULT_MODELS.anthropic
        : DEFAULT_MODELS.gemini;
  return { provider, model };
}

// ---- lazy SDK clients (only loaded when that provider is active) ----
let openaiClient = null;
let anthropicClient = null;

async function getOpenAI() {
  if (!openaiClient) {
    const { default: OpenAI } = await import('openai');
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      ...(env.OPENAI_BASE_URL ? { baseURL: env.OPENAI_BASE_URL } : {}),
      maxRetries: 1,
    });
  }
  return openaiClient;
}

async function getAnthropic() {
  if (!anthropicClient) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 });
  }
  return anthropicClient;
}

// ---- content conversion ----
function partText(content) {
  const text = (content.parts || [])
    .map((p) => p.text || '')
    .join('\n')
    .trim();
  return text || '…'; // providers reject empty message content
}

function toOpenAIMessages(system, contents) {
  return [
    ...(system ? [{ role: 'system', content: system }] : []),
    ...contents.map((c) => ({ role: c.role === 'model' ? 'assistant' : 'user', content: partText(c) })),
  ];
}

function toAnthropicMessages(contents) {
  const msgs = contents.map((c) => ({ role: c.role === 'model' ? 'assistant' : 'user', content: partText(c) }));
  // Anthropic requires the first message to be a user turn; the L1 window can cut mid-pair.
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  return msgs;
}

/**
 * Non-streaming main-model generation.
 * `temperature` is applied on Gemini only — the newest OpenAI/Anthropic
 * models reject non-default sampling params.
 */
export async function generateMainText({ system, contents, temperature = 0.7, maxOutputTokens = 2048, label = 'main' }) {
  const { provider, model } = getEngineInfo();

  if (provider === 'openai') {
    const client = await getOpenAI();
    const completion = await withRetry(
      () =>
        client.chat.completions.create({
          model,
          messages: toOpenAIMessages(system, contents),
          max_completion_tokens: maxOutputTokens,
        }),
      { retries: 1, label: `${label}:openai` }
    );
    return completion.choices?.[0]?.message?.content ?? '';
  }

  if (provider === 'anthropic') {
    const client = await getAnthropic();
    const response = await withRetry(
      () =>
        client.messages.create({
          model,
          max_tokens: maxOutputTokens,
          ...(system ? { system } : {}),
          messages: toAnthropicMessages(contents),
        }),
      { retries: 1, label: `${label}:anthropic` }
    );
    if (response.stop_reason === 'refusal') throw new Error('anthropic refused the request');
    return response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');
  }

  return geminiGenerateText({ model: MODELS.main, system, contents, temperature, maxOutputTokens, label });
}

/**
 * Streaming main-model generation → async iterable of text chunks.
 * Same shape as gemini.generateStream so chatService is provider-agnostic.
 */
export async function generateMainStream({ system, contents, temperature = 0.7, maxOutputTokens = 2048, label = 'main' }) {
  const { provider, model } = getEngineInfo();

  if (provider === 'openai') {
    const client = await getOpenAI();
    const stream = await client.chat.completions.create({
      model,
      messages: toOpenAIMessages(system, contents),
      max_completion_tokens: maxOutputTokens,
      stream: true,
    });
    return (async function* () {
      for await (const chunk of stream) {
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) yield text;
      }
    })();
  }

  if (provider === 'anthropic') {
    const client = await getAnthropic();
    const stream = client.messages.stream({
      model,
      max_tokens: maxOutputTokens,
      ...(system ? { system } : {}),
      messages: toAnthropicMessages(contents),
    });
    return (async function* () {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === 'refusal') throw new Error('anthropic refused the request');
    })();
  }

  return geminiGenerateStream({ model: MODELS.main, system, contents, temperature, maxOutputTokens, label });
}
