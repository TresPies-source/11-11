/**
 * Auto-embedding hooks for prompts.
 * 
 * Automatically generates embeddings when prompts are created or updated.
 * Runs asynchronously to avoid blocking the main operation.
 * 
 * @module lib/librarian/auto-embed
 */

import { embedPrompt, hasEmbedding, refreshEmbedding } from './embeddings';

/**
 * Configuration for auto-embedding behavior.
 */
export interface AutoEmbedConfig {
  /** Enable auto-embedding on create (default: true) */
  onCreate: boolean;
  /** Enable auto-embedding on update (default: true) */
  onUpdate: boolean;
  /** Only refresh if content changed (default: true) */
  onlyIfContentChanged: boolean;
}

const DEFAULT_CONFIG: AutoEmbedConfig = {
  onCreate: true,
  onUpdate: true,
  onlyIfContentChanged: true,
};

let config: AutoEmbedConfig = { ...DEFAULT_CONFIG };

/**
 * Configure auto-embedding behavior.
 * 
 * @param newConfig - Partial configuration to update
 * 
 * @example
 * ```typescript
 * // Disable auto-embedding on update
 * configureAutoEmbed({ onUpdate: false });
 * 
 * // Re-enable with default config
 * configureAutoEmbed({ onUpdate: true });
 * ```
 */
export function configureAutoEmbed(newConfig: Partial<AutoEmbedConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Get current auto-embedding configuration.
 */
export function getAutoEmbedConfig(): AutoEmbedConfig {
  return { ...config };
}

/**
 * Auto-embed hook for new prompts.
 * 
 * Generates embedding asynchronously after prompt creation.
 * Catches and logs errors without throwing.
 * 
 * @param promptId - Prompt ID to embed
 * @param content - Prompt content
 * @param userId - User ID for cost tracking
 * @param sessionId - Optional session ID for cost tracking
 * 
 * @example
 * ```typescript
 * const prompt = await createPrompt({ ... });
 * await autoEmbedOnCreate(prompt.id, prompt.content, userId);
 * ```
 */
export async function autoEmbedOnCreate(
  promptId: string,
  content: string,
  userId: string,
  sessionId?: string
): Promise<void> {
  if (!config.onCreate) {
    console.log(`[AUTO_EMBED] Skipped (disabled): ${promptId}`);
    return;
  }

  if (!content || content.trim().length === 0) {
    console.log(`[AUTO_EMBED] Skipped (empty content): ${promptId}`);
    return;
  }

  try {
    console.log(`[AUTO_EMBED] Embedding new prompt: ${promptId}`);
    await embedPrompt(promptId, content, userId, sessionId);
    console.log(`[AUTO_EMBED] Successfully embedded: ${promptId}`);
  } catch (error) {
    console.error(`[AUTO_EMBED] Failed to embed prompt ${promptId}:`, error);
    // Don't throw - embedding failure shouldn't break prompt creation
  }
}

/**
 * Auto-embed hook for updated prompts.
 * 
 * Regenerates embedding if content changed.
 * Optionally skips if content unchanged (configurable).
 * 
 * @param promptId - Prompt ID to refresh
 * @param newContent - New prompt content (undefined if not changed)
 * @param userId - User ID for cost tracking
 * @param sessionId - Optional session ID for cost tracking
 * 
 * @example
 * ```typescript
 * await updatePrompt(promptId, { content: newContent });
 * await autoEmbedOnUpdate(promptId, newContent, userId);
 * ```
 */
export async function autoEmbedOnUpdate(
  promptId: string,
  newContent: string | undefined,
  userId: string,
  sessionId?: string
): Promise<void> {
  if (!config.onUpdate) {
    console.log(`[AUTO_EMBED] Update skipped (disabled): ${promptId}`);
    return;
  }

  // If content wasn't updated and onlyIfContentChanged is true, skip
  if (config.onlyIfContentChanged && newContent === undefined) {
    console.log(`[AUTO_EMBED] Update skipped (content unchanged): ${promptId}`);
    return;
  }

  // If content is empty, skip
  if (newContent !== undefined && newContent.trim().length === 0) {
    console.log(`[AUTO_EMBED] Update skipped (empty content): ${promptId}`);
    return;
  }

  try {
    // If we have new content, use it; otherwise fetch current content
    if (newContent !== undefined) {
      console.log(`[AUTO_EMBED] Refreshing embedding (content changed): ${promptId}`);
      await refreshEmbedding(promptId, newContent, userId, sessionId);
      console.log(`[AUTO_EMBED] Successfully refreshed: ${promptId}`);
    } else {
      // Content not provided, but config allows embedding anyway
      // Check if embedding exists first
      const hasExistingEmbedding = await hasEmbedding(promptId);
      
      if (!hasExistingEmbedding) {
        console.log(`[AUTO_EMBED] Creating missing embedding: ${promptId}`);
        // Need to fetch content from database
        const db = await import('@/lib/pglite/client').then(m => m.getDB());
        const result = await (await db).query('SELECT content FROM prompts WHERE id = $1', [promptId]);
        
        if (result.rows.length > 0) {
          const row = result.rows[0] as { content: string };
          await embedPrompt(promptId, row.content, userId, sessionId);
          console.log(`[AUTO_EMBED] Successfully embedded: ${promptId}`);
        }
      }
    }
  } catch (error) {
    console.error(`[AUTO_EMBED] Failed to refresh embedding for ${promptId}:`, error);
    // Don't throw - embedding failure shouldn't break prompt update
  }
}

/**
 * Check if auto-embedding is enabled.
 * 
 * @param operation - Operation type ('create' or 'update')
 * @returns True if auto-embedding is enabled for this operation
 */
export function isAutoEmbedEnabled(operation: 'create' | 'update'): boolean {
  return operation === 'create' ? config.onCreate : config.onUpdate;
}
