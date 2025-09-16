-- Add City Event Log table for persistent event storage and replay
-- This enables recovery from failed sync operations

CREATE TABLE IF NOT EXISTS "city_event_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" VARCHAR(255) UNIQUE NOT NULL,
  "event_type" VARCHAR(100) NOT NULL,
  "city_id" UUID NOT NULL,
  "event_data" JSONB NOT NULL,
  "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "processed" BOOLEAN NOT NULL DEFAULT FALSE,
  "processed_at" TIMESTAMP WITH TIME ZONE,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_city_event_logs_event_id" ON "city_event_logs"("event_id");
CREATE INDEX IF NOT EXISTS "idx_city_event_logs_city_id" ON "city_event_logs"("city_id");
CREATE INDEX IF NOT EXISTS "idx_city_event_logs_processed" ON "city_event_logs"("processed", "retry_count", "updated_at");
CREATE INDEX IF NOT EXISTS "idx_city_event_logs_timestamp" ON "city_event_logs"("timestamp");

-- Add foreign key reference to cities table
ALTER TABLE "city_event_logs"
ADD CONSTRAINT "fk_city_event_logs_city_id"
FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE;
