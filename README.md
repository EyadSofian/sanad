# سند — SANAD

**Bilingual AI wellness & productivity companion (Egyptian Arabic / English).**

> ⚠️ **سند مساعد ذكاء اصطناعي — مش معالج نفسي ومش بديل عن المختصين.**
> **Sanad is an AI — not a therapist and not a substitute for professional care.**
> It never diagnoses, never advises medication. It offers psychoeducation ("what you describe resembles a pattern called…"), a safe venting space, evidence-based coping techniques, and an honest productivity mirror.

## Architecture

```
POST /api/chat ──► [1] regex crisis pre-check (sync, zero-LLM, AR+EN)
                   [2] router: gemini-2.5-flash-lite → {persona, emotion, intensity, crisis, kb_query, lang}
                   crisis? ──► fixed-skeleton crisis protocol (resources card, TTS off, personas locked)
                   [3] context: L1 last-12 msgs · L2 memory facts (pgvector) · L3 rolling profile · KB top-2
                   [4] gemini-2.5-flash, SSE streaming, persona prompt (JARVIS/FRIDAY/TARS/CASE)
                   [5] persist  [6] worker (session end): fact extraction → embed → dedupe upsert
```

- **server/** — Node 20 + Express + Prisma (PostgreSQL + pgvector). Routes in `src/routes`, business logic in `src/services`, safety layer in `src/safety`, prompts verbatim from the spec in `src/prompts`.
- **server/src/workers/** — second Railway service: idle-session sweep (fact extraction + summaries, every 5 min), nightly L3 profile rebuild (03:00 Cairo), weekly decay + TARS Objective-Mirror digest (Sun 06:00).
- **web/** — React + Vite + Tailwind PWA. Full RTL, IBM Plex Sans Arabic, persona chips (JARVIS gold · FRIDAY steel-blue · TARS amber · CASE deep-green), hold-to-talk voice notes, opt-in per-message TTS with browser fallback.
- **Voice:** audio goes straight to Gemini as multimodal input (no STT service). TTS: ElevenLabs `eleven_flash_v2_5` with a hard credit budget → automatic `speechSynthesis` fallback.

## Setup

```bash
npm ci                       # installs workspaces + prisma generate
cp .env.example .env         # fill GEMINI_API_KEY, DATABASE_URL, JWT_SECRET…
npm run db:deploy            # prisma migrate deploy (needs pgvector extension)
npm run db:seed              # 10 bilingual psychoeducation KB entries
npm run dev:server           # API on :8080
npm run dev:worker           # cron worker
npm run dev:web              # Vite on :5173 (proxies /api)
```

Production: `npm run build` then `npm run start:web` + `npm run start:worker` as two services sharing one Postgres (Railway). The production start scripts run `prisma migrate deploy` first so a fresh Railway Postgres gets the required tables before auth/chat routes start.

## Safety & compliance (Section 0 of the spec — blocking for launch)

| Item | Status |
|---|---|
| Persistent disclosure banner + first-run modal (AR/EN) | ✅ built |
| Disclosure repeated at every new session start | ✅ built |
| Crisis protocol: regex pre-check + router flag → fixed skeleton, resources card, persona lock | ✅ built + CI-tested |
| Crisis test suite (20 AR + 20 EN must-trigger, 20 benign must-not) in CI on every push | ✅ `server/test/crisis-suite.test.js` |
| 18+ age gate at signup (stored consent) | ✅ built |
| Full data deletion (`DELETE /api/me`) + memory viewer with per-item delete | ✅ built |
| **Crisis hotline numbers verified with current local sources** | ❌ **TODO before launch** — see `server/src/config/crisis-resources.default.json` (`verified:false` logs a warning at boot) |
| Privacy policy page | ❌ TODO before beta |

## Testing

```bash
npm test                          # M1 crisis gate + policy/unit tests (no DB, no API key needed)
npm run eval:diagnosis -w server  # 15 baited diagnosis/medication prompts, LLM-judged (needs GEMINI_API_KEY)
npm run eval:personas -w server   # persona-leakage: acute distress→CASE, CASE style, FRIDAY no-emotions
```

CI (`.github/workflows/ci.yml`) runs lint + the crisis suite + the PWA build on every push, and the LLM evals when the `GEMINI_API_KEY` secret is configured.

## Milestones (spec Section 12)

| M | Deliverable | Status |
|---|---|---|
| M0 | Scaffold, Prisma + pgvector, /health, lint CI | ✅ |
| M1 | Crisis pre-check + handler + resources + CI suite | ✅ |
| M2 | Router + 4 personas + core prompt + SSE + L1 | ✅ (manual scenario eval pending) |
| M3 | KB schema + 10 seed entries + retrieval + diagnosis guard | ✅ |
| M4 | Memory L2/L3 worker + profile + decay + memory UI | ✅ |
| M5 | Voice in (Gemini multimodal) + TTS + budget guard | ✅ (E2E latency check pending) |
| M6 | Metrics endpoint (HMAC) + weekly digest | ✅ (n8n workflow sample pending) |
| M7 | Productionize + Railway deploy + closed beta | 🔜 hotlines verification, privacy policy, deploy |

## Environment variables

See [.env.example](.env.example). `CRISIS_RESOURCES_JSON` overrides the default resources file — every number must be verified before any public launch.

## LLM engines (multi-provider)

The persona replies (and the weekly digest) run on a switchable engine via `LLM_PROVIDER`:

| Provider | Env | Default model |
|---|---|---|
| `gemini` (default) | `GEMINI_API_KEY` | `gemini-2.5-flash` |
| `openai` | `OPENAI_API_KEY` + optional `OPENAI_MODEL` / `OPENAI_BASE_URL` | `gpt-5-mini` |
| `anthropic` | `ANTHROPIC_API_KEY` + optional `ANTHROPIC_MODEL` | `claude-opus-4-8` |

Gemini stays **always required**: the router/classifier, crisis path, embeddings (memory + KB) and voice-note transcription are pinned to it regardless of the main engine (`server/src/lib/llm.js`). The active engine shows up in Settings and in `GET /api/settings → engine`.

For the internal-model / fine-tuning plan (router distillation, LoRA on the Sanad voice, why no LangChain for now), see [docs/ml-roadmap.md](docs/ml-roadmap.md).
