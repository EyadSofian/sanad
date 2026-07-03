import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';
import { logger } from '../lib/logger.js';

const here = path.dirname(fileURLToPath(import.meta.url));

function loadDefault() {
  const raw = fs.readFileSync(path.resolve(here, 'crisis-resources.default.json'), 'utf8');
  return JSON.parse(raw);
}

let cached = null;

/** CRISIS_RESOURCES config: env JSON override > default file. Cached at first use. */
export function getCrisisResources() {
  if (cached) return cached;
  let cfg = loadDefault();
  if (env.CRISIS_RESOURCES_JSON) {
    try {
      cfg = JSON.parse(env.CRISIS_RESOURCES_JSON);
    } catch (err) {
      logger.error({ err: err.message }, 'CRISIS_RESOURCES_JSON is invalid JSON — using default file');
    }
  }
  const unverified = (cfg.resources || []).filter((r) => !r.verified);
  if (unverified.length > 0) {
    logger.warn(
      { count: unverified.length },
      'COMPLIANCE: crisis resources contain UNVERIFIED numbers — verify before public launch (spec Section 0.6)'
    );
  }
  cached = cfg;
  return cfg;
}
