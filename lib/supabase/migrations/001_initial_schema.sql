-- Migration: Initial Schema for The Librarian's Home
-- Version: 0.1
-- Created: January 11, 2026
--
-- MANUAL SETUP INSTRUCTIONS:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire file
-- 5. Execute the query
-- 6. Verify tables were created in Table Editor
--
-- This migration creates the core tables for The Librarian's Home:
-- - prompts: Core prompt storage with status tracking
-- - prompt_metadata: Additional metadata (tags, description, etc.)
-- - critiques: Critique scores and feedback
--
-- Includes indexes for performance, RLS policies for security,
-- and triggers for automatic timestamp updates.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: prompts
-- Core prompt storage with status tracking
-- ============================================================
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'saved', 'archived')),
  drive_file_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: prompt_metadata
-- Additional metadata for prompts (tags, description, etc.)
-- Separate table for flexibility and normalization
-- ============================================================
CREATE TABLE prompt_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE critiques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_status ON prompts(status);
CREATE INDEX idx_prompts_user_status ON prompts(user_id, status);
CREATE INDEX idx_prompts_updated_at ON prompts(updated_at DESC);
CREATE INDEX idx_prompts_drive_file_id ON prompts(drive_file_id);

-- Critiques indexes
CREATE INDEX idx_critiques_prompt_id ON critiques(prompt_id);

-- Metadata indexes
CREATE INDEX idx_prompt_metadata_prompt_id ON prompt_metadata(prompt_id);
CREATE INDEX idx_prompt_metadata_tags ON prompt_metadata USING GIN(tags);

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
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enforce user isolation - users can only access their own data
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE critiques ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: prompts table
-- ============================================================

-- Policy: Users can view their own prompts
CREATE POLICY "Users can view own prompts"
  ON prompts FOR SELECT
  USING (user_id = current_setting('app.user_id', true)::text);

-- Policy: Users can insert their own prompts
CREATE POLICY "Users can insert own prompts"
  ON prompts FOR INSERT
  WITH CHECK (user_id = current_setting('app.user_id', true)::text);

-- Policy: Users can update their own prompts
CREATE POLICY "Users can update own prompts"
  ON prompts FOR UPDATE
  USING (user_id = current_setting('app.user_id', true)::text);

-- Policy: Users can delete their own prompts
CREATE POLICY "Users can delete own prompts"
  ON prompts FOR DELETE
  USING (user_id = current_setting('app.user_id', true)::text);

-- ============================================================
-- RLS POLICIES: prompt_metadata table
-- Inherits access control from prompts table via JOIN
-- ============================================================

-- Policy: Users can view metadata for their own prompts
CREATE POLICY "Users can view own metadata"
  ON prompt_metadata FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM prompts
    WHERE prompts.id = prompt_metadata.prompt_id
    AND prompts.user_id = current_setting('app.user_id', true)::text
  ));

-- Policy: Users can manage metadata for their own prompts
CREATE POLICY "Users can manage own metadata"
  ON prompt_metadata FOR ALL
  USING (EXISTS (
    SELECT 1 FROM prompts
    WHERE prompts.id = prompt_metadata.prompt_id
    AND prompts.user_id = current_setting('app.user_id', true)::text
  ));

-- ============================================================
-- RLS POLICIES: critiques table
-- Inherits access control from prompts table via JOIN
-- ============================================================

-- Policy: Users can view critiques for their own prompts
CREATE POLICY "Users can view own critiques"
  ON critiques FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM prompts
    WHERE prompts.id = critiques.prompt_id
    AND prompts.user_id = current_setting('app.user_id', true)::text
  ));

-- Policy: Users can manage critiques for their own prompts
CREATE POLICY "Users can manage own critiques"
  ON critiques FOR ALL
  USING (EXISTS (
    SELECT 1 FROM prompts
    WHERE prompts.id = critiques.prompt_id
    AND prompts.user_id = current_setting('app.user_id', true)::text
  ));

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Next steps:
-- 1. Verify tables exist in Supabase Table Editor
-- 2. Test RLS policies with test data
-- 3. Set up Supabase environment variables in .env.local
-- 4. Implement Supabase client and data access layer
-- ============================================================
