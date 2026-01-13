export const migration007 = `
-- Migration 007: Add Context Management tables
-- Date: 2026-01-13
-- Purpose: Support hierarchical context management with 4-tier system

-- ============================================================
-- TABLE: context_snapshots
-- Stores context snapshots with tier breakdown and pruning info
-- ============================================================
CREATE TABLE IF NOT EXISTS context_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tier_breakdown JSONB NOT NULL,
  total_tokens INTEGER NOT NULL,
  budget_percent NUMERIC NOT NULL,
  pruning_strategy JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_context_snapshots_session 
  ON context_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_context_snapshots_user 
  ON context_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_context_snapshots_created 
  ON context_snapshots(created_at DESC);
`;

export async function applyMigration007(db: any): Promise<void> {
  try {
    console.log('[Migration 007] Adding Context Management tables...');
    await db.exec(migration007);
    console.log('[Migration 007] Successfully added context_snapshots table');
  } catch (error) {
    console.error('[Migration 007] Error applying migration:', error);
    throw error;
  }
}
