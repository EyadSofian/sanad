import { env } from '../config/env.js';
import { embedText as geminiEmbedText, isGeminiConfigured } from './gemini.js';
import { getOpenAIClient } from './llm.js';
import { logger } from './logger.js';

const DEFAULT_OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
const DEFAULT_DIMENSIONS = 768;

function activeEmbeddingProvider() {
  const requested = env.EMBEDDING_PROVIDER;
  if (requested === 'openai') {
    if (env.OPENAI_API_KEY) return 'openai';
    logger.warn('EMBEDDING_PROVIDER=openai but OPENAI_API_KEY is missing');
  }
  if (requested === 'gemini') {
    if (env.GEMINI_API_KEY) return 'gemini';
    logger.warn('EMBEDDING_PROVIDER=gemini but GEMINI_API_KEY is missing');
  }
  if (!requested && env.GEMINI_API_KEY) return 'gemini';
  if (env.OPENAI_API_KEY) return 'openai';
  return 'none';
}

export function getEmbeddingInfo() {
  const provider = activeEmbeddingProvider();
  if (provider === 'openai') {
    return {
      provider,
      model: env.OPENAI_EMBEDDING_MODEL || DEFAULT_OPENAI_EMBEDDING_MODEL,
      dimensions: env.EMBEDDING_DIMENSIONS || DEFAULT_DIMENSIONS,
    };
  }
  if (provider === 'gemini') {
    return { provider, model: 'text-embedding-004', dimensions: DEFAULT_DIMENSIONS };
  }
  return { provider: 'none', model: null, dimensions: DEFAULT_DIMENSIONS };
}

export function isEmbeddingConfigured() {
  const provider = activeEmbeddingProvider();
  return provider === 'openai' || (provider === 'gemini' && isGeminiConfigured());
}

export async function embedText(text, { label = 'embed' } = {}) {
  const info = getEmbeddingInfo();
  if (info.provider === 'gemini') return geminiEmbedText(text, { label });
  if (info.provider !== 'openai') throw new Error('No embedding provider configured');

  const client = await getOpenAIClient();
  const response = await client.embeddings.create({
    model: info.model,
    input: text,
    encoding_format: 'float',
    dimensions: info.dimensions,
  });
  const values = response.data?.[0]?.embedding;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('OpenAI embeddings returned no values');
  }
  if (values.length !== info.dimensions) {
    throw new Error(`Embedding dimension mismatch: expected ${info.dimensions}, got ${values.length}`);
  }
  return values;
}
