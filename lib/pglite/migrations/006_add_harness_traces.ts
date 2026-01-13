export const migration006 = `
-- Migration 006: Add Harness Trace tables
-- Date: 2026-01-13
-- Purpose: Support nested JSON logging for agent execution traces

-- ============================================================
-- TABLE: harness_traces
-- Stores complete execution traces with nested events
-- ============================================================
CREATE TABLE IF NOT EXISTS harness_traces (
  trace_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary JSONB NOT NULL DEFAULT '{
    "total_events": 0,
    "total_duration_ms": 0,
    "total_tokens": 0,
    "total_cost_usd": 0,
    "agents_used": [],
    "modes_used": [],
    "errors": 0
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_harness_traces_session_id 
  ON harness_traces(session_id);
CREATE INDEX IF NOT EXISTS idx_harness_traces_user_id 
  ON harness_traces(user_id);
CREATE INDEX IF NOT EXISTS idx_harness_traces_started_at 
  ON harness_traces(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_harness_traces_created_at 
  ON harness_traces(created_at DESC);
`;

export async function applyMigration006(db: any): Promise<void> {
  try {
    console.log('[Migration 006] Adding Harness Trace tables...');
    await db.exec(migration006);
    console.log('[Migration 006] Successfully added harness_traces table');
  } catch (error) {
    console.error('[Migration 006] Error applying migration:', error);
    throw error;
  }
}
