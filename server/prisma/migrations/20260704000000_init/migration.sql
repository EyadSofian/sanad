-- SANAD initial schema (pgvector required)
CREATE EXTENSION IF NOT EXISTS vector;

-- users
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "pass_hash" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'ar',
    "tars_honesty" INTEGER NOT NULL DEFAULT 90,
    "tars_humor" INTEGER NOT NULL DEFAULT 60,
    "tts_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_adult_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "profile" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- sessions
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "summary" TEXT,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "sessions_user_id_started_at_idx" ON "sessions"("user_id", "started_at");

-- messages
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "persona" TEXT,
    "content" TEXT NOT NULL,
    "emotion" TEXT,
    "intensity" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "messages_session_id_created_at_idx" ON "messages"("session_id", "created_at");

-- memory_facts
CREATE TABLE "memory_facts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "fact" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "embedding" vector(768),
    "salience" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "last_seen" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_message" UUID,
    CONSTRAINT "memory_facts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "memory_facts_user_id_idx" ON "memory_facts"("user_id");

-- kb_entries
CREATE TABLE "kb_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "body_en" TEXT NOT NULL,
    "body_ar" TEXT NOT NULL,
    "techniques" JSONB NOT NULL,
    "refer_when_en" TEXT NOT NULL,
    "refer_when_ar" TEXT NOT NULL,
    "sources" JSONB NOT NULL,
    "embedding" vector(768),
    CONSTRAINT "kb_entries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "kb_entries_slug_key" ON "kb_entries"("slug");

-- crisis_events
CREATE TABLE "crisis_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "message_id" UUID,
    "trigger" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crisis_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "crisis_events_user_id_created_at_idx" ON "crisis_events"("user_id", "created_at");

-- metrics_log
CREATE TABLE "metrics_log" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "day" DATE NOT NULL,
    CONSTRAINT "metrics_log_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "metrics_log_user_id_day_idx" ON "metrics_log"("user_id", "day");

-- digests
CREATE TABLE "digests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "week_start" DATE NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "digests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "digests_user_id_created_at_idx" ON "digests"("user_id", "created_at");

-- tts_usage
CREATE TABLE "tts_usage" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "chars" INTEGER NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tts_usage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "tts_usage_user_id_idx" ON "tts_usage"("user_id");

-- tts_cache
CREATE TABLE "tts_cache" (
    "hash" TEXT NOT NULL,
    "audio" BYTEA NOT NULL,
    "chars" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tts_cache_pkey" PRIMARY KEY ("hash")
);

-- foreign keys
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memory_facts" ADD CONSTRAINT "memory_facts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crisis_events" ADD CONSTRAINT "crisis_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crisis_events" ADD CONSTRAINT "crisis_events_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "metrics_log" ADD CONSTRAINT "metrics_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "digests" ADD CONSTRAINT "digests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tts_usage" ADD CONSTRAINT "tts_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ANN indexes (pgvector >= 0.5). Optional: skipped gracefully on older pgvector.
DO $$ BEGIN
  CREATE INDEX "memory_facts_embedding_hnsw" ON "memory_facts" USING hnsw ("embedding" vector_cosine_ops);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hnsw index on memory_facts skipped: %', SQLERRM;
END $$;
DO $$ BEGIN
  CREATE INDEX "kb_entries_embedding_hnsw" ON "kb_entries" USING hnsw ("embedding" vector_cosine_ops);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hnsw index on kb_entries skipped: %', SQLERRM;
END $$;
