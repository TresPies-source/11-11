export const migration008 = `
-- Migration 008: Add Safety Switch tables
-- Date: 2026-01-13
-- Purpose: Track Safety Switch activations, recoveries, and failures

-- ============================================================
-- TABLE: safety_switch_events
-- Stores Safety Switch activation and recovery events
-- ============================================================
CREATE TABLE IF NOT EXISTS safety_switch_events (
  id TEXT PRIMARY KEY DEFAULT ('evt_' || replace(gen_random_uuid()::text, '-', '')),
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  error_message TEXT,
  context TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_safety_switch_session 
  ON safety_switch_events(session_id);
CREATE INDEX IF NOT EXISTS idx_safety_switch_user 
  ON safety_switch_events(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_switch_created 
  ON safety_switch_events(created_at);
`;

export async function applyMigration008(db: any): Promise<void> {
  try {
    console.log('[Migration 008] Adding Safety Switch tables...');
    await db.exec(migration008);
    console.log('[Migration 008] Successfully added safety_switch_events table');
  } catch (error) {
    console.error('[Migration 008] Error applying migration:', error);
    throw error;
  }
}
