export const migration002 = `
-- Migration 002: Add status_history column to prompts table
-- Date: 2026-01-12
-- Purpose: Track full status lifecycle with history

-- Add status_history column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'status_history'
  ) THEN
    ALTER TABLE prompts ADD COLUMN status_history JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create GIN index for status_history queries
CREATE INDEX IF NOT EXISTS idx_prompts_status_history 
ON prompts USING GIN(status_history);
`;

export async function applyMigration002(db: any): Promise<void> {
  try {
    console.log('[Migration 002] Adding status_history column...');
    await db.exec(migration002);
    console.log('[Migration 002] Successfully added status_history column');
  } catch (error) {
    console.error('[Migration 002] Error applying migration:', error);
    throw error;
  }
}
