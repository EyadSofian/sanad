import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
// Load the first .env found: cwd, server/, repo root. Existing process vars always win.
for (const p of [
  path.resolve(process.cwd(), '.env'),
  path.resolve(here, '../../.env'),
  path.resolve(here, '../../../.env'),
]) {
  if (fs.existsSync(p)) dotenv.config({ path: p });
}

const num = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  PORT: num(process.env.PORT, 8080),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
  ELEVEN_VOICE_ID: process.env.ELEVEN_VOICE_ID || '',
  TTS_CREDIT_BUDGET: num(process.env.TTS_CREDIT_BUDGET, 10000),
  METRICS_HMAC_SECRET: process.env.METRICS_HMAC_SECRET || '',
  CRISIS_RESOURCES_JSON: process.env.CRISIS_RESOURCES_JSON || '',
  RATE_LIMIT_CHAT_PER_HOUR: num(process.env.RATE_LIMIT_CHAT_PER_HOUR, 60),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',
  STATIC_DIR: process.env.STATIC_DIR || '',
};

export function requireEnv(key) {
  if (!env[key]) throw new Error(`Missing required environment variable: ${key}`);
  return env[key];
}

export function productionSanityCheck(logger) {
  if (!env.isProd) return;
  const problems = [];
  if (env.JWT_SECRET === 'dev-only-secret-change-me') problems.push('JWT_SECRET is the dev default');
  if (!env.GEMINI_API_KEY) problems.push('GEMINI_API_KEY is missing');
  if (!env.METRICS_HMAC_SECRET) problems.push('METRICS_HMAC_SECRET is missing (POST /api/metrics disabled)');
  for (const p of problems) logger.warn({ problem: p }, 'production config warning');
}
