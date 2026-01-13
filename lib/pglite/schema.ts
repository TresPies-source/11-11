export const SCHEMA_SQL = `
-- ============================================================
-- TABLE: prompts
-- Core prompt storage with status tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'saved', 'archived')),
  status_history JSONB DEFAULT '[]'::jsonb,
  drive_file_id TEXT,
  published_at TIMESTAMPTZ,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public')),
  author_name TEXT,
  author_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: prompt_metadata
-- Additional metadata for prompts (tags, description, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS prompt_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  description TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  author TEXT,
  version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT prompt_metadata_prompt_id_unique UNIQUE (prompt_id)
);

-- ============================================================
-- TABLE: critiques
-- Stores critique scores and detailed feedback for prompts
-- ============================================================
CREATE TABLE IF NOT EXISTS critiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  conciseness_score INTEGER NOT NULL CHECK (conciseness_score >= 0 AND conciseness_score <= 25),
  specificity_score INTEGER NOT NULL CHECK (specificity_score >= 0 AND specificity_score <= 25),
  context_score INTEGER NOT NULL CHECK (context_score >= 0 AND context_score <= 25),
  task_decomposition_score INTEGER NOT NULL CHECK (task_decomposition_score >= 0 AND task_decomposition_score <= 25),
  feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- Performance optimization for common query patterns
-- ============================================================

-- Prompts indexes
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_status ON prompts(status);
CREATE INDEX IF NOT EXISTS idx_prompts_user_status ON prompts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_prompts_updated_at ON prompts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_drive_file_id ON prompts(drive_file_id);
CREATE INDEX IF NOT EXISTS idx_prompts_status_history ON prompts USING GIN(status_history);
CREATE INDEX IF NOT EXISTS idx_prompts_visibility_published ON prompts(visibility, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_author_id ON prompts(author_id);

-- Critiques indexes
CREATE INDEX IF NOT EXISTS idx_critiques_prompt_id ON critiques(prompt_id);

-- Metadata indexes
CREATE INDEX IF NOT EXISTS idx_prompt_metadata_prompt_id ON prompt_metadata(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_metadata_tags ON prompt_metadata USING GIN(tags);

-- ============================================================
-- TRIGGERS
-- Automatic timestamp updates
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for prompts table
DROP TRIGGER IF EXISTS update_prompts_updated_at ON prompts;
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

export const MIGRATION_SQL = `
-- ============================================================
-- MIGRATION: Add public prompts support (v0.2.5)
-- ============================================================

-- Add new columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE prompts ADD COLUMN published_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE prompts ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private' 
      CHECK (visibility IN ('private', 'unlisted', 'public'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'author_name'
  ) THEN
    ALTER TABLE prompts ADD COLUMN author_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'author_id'
  ) THEN
    ALTER TABLE prompts ADD COLUMN author_id TEXT;
  END IF;
END $$;

-- Backfill author_id from user_id for existing prompts
UPDATE prompts 
SET author_id = user_id 
WHERE author_id IS NULL;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_prompts_visibility_published ON prompts(visibility, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_author_id ON prompts(author_id);
`;

export async function initializeSchema(db: any): Promise<void> {
  try {
    console.log('[PGlite] Initializing database schema...');
    await db.exec(SCHEMA_SQL);
    console.log('[PGlite] Schema initialized successfully');
    
    console.log('[PGlite] Running migrations...');
    await db.exec(MIGRATION_SQL);
    console.log('[PGlite] Migrations completed successfully');
  } catch (error) {
    console.error('[PGlite] Error initializing schema:', error);
    throw error;
  }
}

export async function checkIfInitialized(db: any): Promise<boolean> {
  try {
    const result = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'prompts'
      );
    `);
    return result.rows[0]?.exists === true;
  } catch (error) {
    return false;
  }
}
