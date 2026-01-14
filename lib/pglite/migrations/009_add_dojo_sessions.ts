export const migration009 = `
-- Migration 009: Add Dojo Session Schema
-- Date: 2026-01-13
-- Purpose: Add DojoPacket v1.0 support for portable session exports

-- ============================================================
-- ALTER TABLE: sessions
-- Add Dojo-specific columns for session tracking
-- ============================================================
DO $$ 
BEGIN
  -- Add title column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'title'
  ) THEN
    ALTER TABLE sessions ADD COLUMN title TEXT;
  END IF;

  -- Add mode column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'mode'
  ) THEN
    ALTER TABLE sessions ADD COLUMN mode TEXT 
      CHECK (mode IN ('Mirror', 'Scout', 'Gardener', 'Implementation'));
  END IF;

  -- Add situation column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'situation'
  ) THEN
    ALTER TABLE sessions ADD COLUMN situation TEXT;
  END IF;

  -- Add stake column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'stake'
  ) THEN
    ALTER TABLE sessions ADD COLUMN stake TEXT;
  END IF;

  -- Add agent_path column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'agent_path'
  ) THEN
    ALTER TABLE sessions ADD COLUMN agent_path JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add next_move_action column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'next_move_action'
  ) THEN
    ALTER TABLE sessions ADD COLUMN next_move_action TEXT;
  END IF;

  -- Add next_move_why column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'next_move_why'
  ) THEN
    ALTER TABLE sessions ADD COLUMN next_move_why TEXT;
  END IF;

  -- Add next_move_test column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'next_move_test'
  ) THEN
    ALTER TABLE sessions ADD COLUMN next_move_test TEXT;
  END IF;

  -- Add artifacts column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'artifacts'
  ) THEN
    ALTER TABLE sessions ADD COLUMN artifacts JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================================
-- TABLE: session_perspectives
-- Store multiple perspectives per session
-- ============================================================
CREATE TABLE IF NOT EXISTS session_perspectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('user', 'agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: session_assumptions
-- Store assumptions and challenged flag
-- ============================================================
CREATE TABLE IF NOT EXISTS session_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  challenged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: session_decisions
-- Store decisions with rationale
-- ============================================================
CREATE TABLE IF NOT EXISTS session_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  rationale TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- Performance optimization for common query patterns
-- ============================================================

-- Sessions indexes (additional to existing)
CREATE INDEX IF NOT EXISTS idx_sessions_mode ON sessions(mode);

-- Perspectives indexes
CREATE INDEX IF NOT EXISTS idx_session_perspectives_session_id 
  ON session_perspectives(session_id);
CREATE INDEX IF NOT EXISTS idx_session_perspectives_created_at 
  ON session_perspectives(created_at);

-- Assumptions indexes
CREATE INDEX IF NOT EXISTS idx_session_assumptions_session_id 
  ON session_assumptions(session_id);

-- Decisions indexes
CREATE INDEX IF NOT EXISTS idx_session_decisions_session_id 
  ON session_decisions(session_id);
`;

export async function applyMigration009(db: any): Promise<void> {
  try {
    console.log('[Migration 009] Adding Dojo Session schema...');
    await db.exec(migration009);
    console.log('[Migration 009] Successfully added Dojo Session tables');
  } catch (error) {
    console.error('[Migration 009] Error applying migration:', error);
    throw error;
  }
}
