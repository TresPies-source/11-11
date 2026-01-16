export const migration011 = `
-- Migration 011: Add Knowledge Hub Schema
-- Date: 2026-01-15
-- Purpose: Add knowledge_links and session_messages tables for Knowledge Hub feature

-- ============================================================
-- TABLE: knowledge_links
-- Stores bidirectional relationships between knowledge artifacts
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('session', 'prompt', 'seed', 'file')),
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('session', 'prompt', 'seed', 'file')),
  target_id TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('extracted_from', 'discussed_in', 'refined_in', 'created_from')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT NOT NULL
);

-- ============================================================
-- INDEXES
-- Performance optimization for common query patterns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_knowledge_links_source ON knowledge_links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_target ON knowledge_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_user ON knowledge_links(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_created_at ON knowledge_links(created_at DESC);

-- ============================================================
-- TABLE: session_messages
-- Stores Dojo session messages for persistence and extraction
-- ============================================================
CREATE TABLE IF NOT EXISTS session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'agent')),
  content TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('Mirror', 'Scout', 'Gardener', 'Implementation')),
  timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- Performance optimization for session message queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_timestamp ON session_messages(timestamp);
`;

/**
 * Applies Migration 011 to the database, creating the Knowledge Hub schema.
 * 
 * This migration adds two critical tables:
 * - knowledge_links: Tracks relationships between artifacts (prompts, seeds, sessions, files)
 * - session_messages: Persists Dojo conversation messages for retrieval and extraction
 * 
 * Both tables include optimized indexes for common query patterns.
 * 
 * @param db - PGlite database instance
 * @throws Error if migration fails (e.g., SQL syntax error, constraint violation)
 */
export async function applyMigration011(db: any): Promise<void> {
  try {
    console.log('[Migration 011] Adding Knowledge Hub schema...');
    await db.exec(migration011);
    console.log('[Migration 011] Successfully added knowledge_links and session_messages tables');
  } catch (error) {
    console.error('[Migration 011] Error applying migration:', error);
    throw error;
  }
}
