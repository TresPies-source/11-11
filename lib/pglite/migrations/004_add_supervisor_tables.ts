export const migration004 = `
-- Migration 004: Add Supervisor Router tables
-- Date: 2026-01-12
-- Purpose: Support agent routing, cost tracking, and handoffs

-- ============================================================
-- TABLE: routing_decisions
-- Stores routing decisions made by the Supervisor
-- ============================================================
CREATE TABLE IF NOT EXISTS routing_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_query TEXT NOT NULL,
  agent_selected TEXT NOT NULL,
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT NOT NULL,
  is_fallback BOOLEAN DEFAULT false,
  conversation_context JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routing_decisions_session_id 
  ON routing_decisions(session_id);
CREATE INDEX IF NOT EXISTS idx_routing_decisions_agent_selected 
  ON routing_decisions(agent_selected);
CREATE INDEX IF NOT EXISTS idx_routing_decisions_created_at 
  ON routing_decisions(created_at DESC);

-- ============================================================
-- TABLE: routing_costs
-- Tracks costs associated with routing decisions
-- ============================================================
CREATE TABLE IF NOT EXISTS routing_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_decision_id UUID REFERENCES routing_decisions(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routing_costs_session_id 
  ON routing_costs(session_id);
CREATE INDEX IF NOT EXISTS idx_routing_costs_routing_decision_id 
  ON routing_costs(routing_decision_id);
CREATE INDEX IF NOT EXISTS idx_routing_costs_created_at 
  ON routing_costs(created_at DESC);

-- ============================================================
-- TABLE: agent_handoffs
-- Tracks handoffs between agents with full context preservation
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  reason TEXT NOT NULL,
  conversation_history JSONB DEFAULT '[]'::jsonb,
  harness_trace_id TEXT,
  user_intent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_handoffs_session_id 
  ON agent_handoffs(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_handoffs_from_to 
  ON agent_handoffs(from_agent, to_agent);
CREATE INDEX IF NOT EXISTS idx_agent_handoffs_created_at 
  ON agent_handoffs(created_at DESC);
`;

export async function applyMigration004(db: any): Promise<void> {
  try {
    console.log('[Migration 004] Adding Supervisor Router tables...');
    await db.exec(migration004);
    console.log('[Migration 004] Successfully added routing_decisions, routing_costs, and agent_handoffs tables');
  } catch (error) {
    console.error('[Migration 004] Error applying migration:', error);
    throw error;
  }
}
