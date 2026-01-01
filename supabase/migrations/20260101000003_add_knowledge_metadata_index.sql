-- Create a GIN index on the metadata column of the knowledge table
-- This optimizes queries using JSONB operators like @>, ?, ?&, ?|
CREATE INDEX IF NOT EXISTS "idx_knowledge_metadata" ON "public"."knowledge" USING GIN ("metadata");
