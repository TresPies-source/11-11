export const migration012 = `
-- Migration 012: Add AI Gateway Schema
-- Date: 2026-01-19
-- Purpose: Add ai_providers and ai_gateway_logs tables for AI Gateway feature

-- ============================================================
-- TABLE: ai_providers
-- Stores AI provider configurations (DeepSeek, OpenAI, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  api_base_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SEED DATA: ai_providers
-- Insert default providers (DeepSeek and OpenAI)
-- ============================================================
INSERT INTO ai_providers (id, name, api_base_url, is_active) VALUES
  ('deepseek', 'DeepSeek', 'https://api.deepseek.com', true),
  ('openai', 'OpenAI', 'https://api.openai.com/v1', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TABLE: ai_gateway_logs
-- Stores all AI Gateway requests for monitoring and analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_gateway_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  request_id TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  task_type TEXT,
  provider_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  latency_ms INTEGER,
  cost_usd DECIMAL(10, 6),
  status_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- Performance optimization for common query patterns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_user_id ON ai_gateway_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_session_id ON ai_gateway_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_provider_id ON ai_gateway_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_task_type ON ai_gateway_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_created_at ON ai_gateway_logs(created_at DESC);
`;

/**
 * Applies Migration 012 to the database, creating the AI Gateway schema.
 * 
 * This migration adds two critical tables:
 * - ai_providers: Provider registry (DeepSeek, OpenAI, etc.)
 * - ai_gateway_logs: Request/response logs for monitoring and analytics
 * 
 * Both tables include optimized indexes for common query patterns.
 * 
 * @param db - PGlite database instance
 * @throws Error if migration fails (e.g., SQL syntax error, constraint violation)
 */
export async function applyMigration012(db: any): Promise<void> {
  try {
    console.log('[Migration 012] Adding AI Gateway schema...');
    await db.exec(migration012);
    console.log('[Migration 012] Successfully added ai_providers and ai_gateway_logs tables');
  } catch (error) {
    console.error('[Migration 012] Error applying migration:', error);
    throw error;
  }
}
