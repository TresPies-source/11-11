export const migration005 = `
-- Migration 005: Add Vector Search for Librarian Agent
-- Date: 2026-01-13
-- Purpose: Enable semantic search using embeddings (JSONB arrays instead of pgvector)

-- ============================================================
-- ALTER TABLE: prompts
-- Add embedding column for semantic search
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE prompts ADD COLUMN embedding JSONB DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_prompts_embedding 
      ON prompts USING GIN(embedding);
  END IF;
END $$;

-- ============================================================
-- TABLE: search_history
-- Tracks user search queries for analytics and suggestions
-- ============================================================
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  filters JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id 
  ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at 
  ON search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_user_created 
  ON search_history(user_id, created_at DESC);

-- ============================================================
-- FUNCTION: cosine_similarity
-- Calculates cosine similarity between two embedding vectors
-- Returns a value between -1 and 1 (higher = more similar)
-- ============================================================
CREATE OR REPLACE FUNCTION cosine_similarity(a JSONB, b JSONB)
RETURNS REAL AS $$
DECLARE
  dot_product REAL := 0;
  magnitude_a REAL := 0;
  magnitude_b REAL := 0;
  i INTEGER;
  len INTEGER;
  val_a REAL;
  val_b REAL;
BEGIN
  IF a IS NULL OR b IS NULL THEN
    RETURN NULL;
  END IF;

  len := jsonb_array_length(a);
  
  IF len != jsonb_array_length(b) THEN
    RETURN NULL;
  END IF;

  FOR i IN 0..(len - 1) LOOP
    val_a := (a->i)::text::real;
    val_b := (b->i)::text::real;
    
    dot_product := dot_product + (val_a * val_b);
    magnitude_a := magnitude_a + (val_a * val_a);
    magnitude_b := magnitude_b + (val_b * val_b);
  END LOOP;

  IF magnitude_a = 0 OR magnitude_b = 0 THEN
    RETURN 0;
  END IF;

  RETURN dot_product / (sqrt(magnitude_a) * sqrt(magnitude_b));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
`;

export async function applyMigration005(db: any): Promise<void> {
  try {
    console.log('[Migration 005] Adding vector search support...');
    await db.exec(migration005);
    console.log('[Migration 005] Successfully added embedding column, search_history table, and cosine_similarity function');
  } catch (error) {
    console.error('[Migration 005] Error applying migration:', error);
    throw error;
  }
}
