export const migration010 = `
-- Migration 010: Add Seeds Schema
-- Date: 2026-01-13
-- Purpose: Add Knowledge Seeds management for Memory Garden pattern

-- ============================================================
-- TABLE: seeds
-- Stores knowledge seeds with metadata and status tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS seeds (
  id TEXT PRIMARY KEY DEFAULT ('seed_' || replace(gen_random_uuid()::text, '-', '')),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('principle', 'pattern', 'question', 'route', 'artifact', 'constraint')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'growing', 'mature', 'compost')),
  content TEXT NOT NULL,
  why_matters TEXT,
  revisit_when TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT,
  session_id TEXT,
  replanted BOOLEAN NOT NULL DEFAULT false,
  replant_count INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- INDEXES
-- Performance optimization for common query patterns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_seeds_type ON seeds(type);
CREATE INDEX IF NOT EXISTS idx_seeds_status ON seeds(status);
CREATE INDEX IF NOT EXISTS idx_seeds_user_id ON seeds(user_id);
CREATE INDEX IF NOT EXISTS idx_seeds_session_id ON seeds(session_id);
CREATE INDEX IF NOT EXISTS idx_seeds_created_at ON seeds(created_at);
CREATE INDEX IF NOT EXISTS idx_seeds_updated_at ON seeds(updated_at);
CREATE INDEX IF NOT EXISTS idx_seeds_name ON seeds(name);

-- ============================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_seeds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_seeds_updated_at ON seeds;

CREATE TRIGGER trigger_update_seeds_updated_at
  BEFORE UPDATE ON seeds
  FOR EACH ROW
  EXECUTE FUNCTION update_seeds_updated_at();
`;

export async function applyMigration010(db: any): Promise<void> {
  try {
    console.log('[Migration 010] Adding Seeds schema...');
    await db.exec(migration010);
    console.log('[Migration 010] Successfully added seeds table');
  } catch (error) {
    console.error('[Migration 010] Error applying migration:', error);
    throw error;
  }
}
