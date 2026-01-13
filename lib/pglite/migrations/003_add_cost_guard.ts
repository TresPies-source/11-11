export const migration003 = `
-- Migration 003: Add Cost Guard tables
-- Date: 2026-01-12
-- Purpose: Three-tier budgeting system for LLM cost management

-- ============================================================
-- TABLE: sessions
-- Track session-level token usage
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  total_tokens INTEGER NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
  total_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0 CHECK (total_cost_usd >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: user_monthly_usage
-- Track user-level monthly token usage
-- ============================================================
CREATE TABLE IF NOT EXISTS user_monthly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  month TEXT NOT NULL,
  total_tokens INTEGER NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
  total_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0 CHECK (total_cost_usd >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_monthly_usage_user_month_unique UNIQUE (user_id, month)
);

-- ============================================================
-- TABLE: cost_records
-- Log all LLM costs per query
-- ============================================================
CREATE TABLE IF NOT EXISTS cost_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  query_id TEXT,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL CHECK (prompt_tokens >= 0),
  completion_tokens INTEGER NOT NULL CHECK (completion_tokens >= 0),
  total_tokens INTEGER NOT NULL CHECK (total_tokens >= 0),
  cost_usd DECIMAL(10, 6) NOT NULL CHECK (cost_usd >= 0),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('routing', 'agent_execution', 'search', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- Performance optimization for common query patterns
-- ============================================================

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

-- User monthly usage indexes
CREATE INDEX IF NOT EXISTS idx_user_monthly_usage_user_id ON user_monthly_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_monthly_usage_month ON user_monthly_usage(month DESC);
CREATE INDEX IF NOT EXISTS idx_user_monthly_usage_user_month ON user_monthly_usage(user_id, month);

-- Cost records indexes
CREATE INDEX IF NOT EXISTS idx_cost_records_user_id ON cost_records(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_records_session_id ON cost_records(session_id);
CREATE INDEX IF NOT EXISTS idx_cost_records_created_at ON cost_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_records_operation_type ON cost_records(operation_type);

-- ============================================================
-- TRIGGERS
-- Automatic timestamp updates
-- ============================================================

-- Trigger for sessions table
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_monthly_usage table
DROP TRIGGER IF EXISTS update_user_monthly_usage_updated_at ON user_monthly_usage;
CREATE TRIGGER update_user_monthly_usage_updated_at
  BEFORE UPDATE ON user_monthly_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

export async function applyMigration003(db: any): Promise<void> {
  try {
    console.log('[Migration 003] Adding Cost Guard tables...');
    await db.exec(migration003);
    console.log('[Migration 003] Successfully added Cost Guard tables');
  } catch (error) {
    console.error('[Migration 003] Error applying migration:', error);
    throw error;
  }
}
