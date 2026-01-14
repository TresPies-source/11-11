/**
 * Proactive suggestions module for Librarian Agent.
 * 
 * Generates contextual suggestions based on user activity:
 * - Similar prompts (semantic similarity)
 * - Recent work (recently modified prompts)
 * - Related seeds (future: seed patches integration)
 * 
 * @module lib/librarian/suggestions
 */

import { getDB } from '@/lib/pglite/client';
import { findSimilarPrompts } from './search';
import type { PromptRow, PromptStatus } from '@/lib/pglite/types';

export type SuggestionType = 'similar_prompt' | 'related_seed' | 'recent_work';

export interface Suggestion {
  type: SuggestionType;
  title: string;
  description: string;
  action: string;
  target_id: string;
  similarity?: number;
  metadata?: {
    status?: PromptStatus;
    tags?: string[] | null;
    updated_at?: string;
  };
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
  context: {
    prompt_id?: string;
    user_id: string;
    trigger: 'manual' | 'prompt_save' | 'dojo_session' | 'page_load';
  };
  generated_at: string;
}

/**
 * Generate proactive suggestions based on current context.
 * 
 * **Triggers:**
 * - After user saves a prompt (trigger: 'prompt_save')
 * - After user completes a Dojo session (trigger: 'dojo_session')
 * - When user opens the Librarian page (trigger: 'page_load')
 * - Manual request (trigger: 'manual')
 * 
 * **Suggestion Types:**
 * - **similar_prompt**: Prompts semantically similar to current/recent work
 * - **recent_work**: Recently modified prompts for quick access
 * - **related_seed**: (Future) Related seed patches based on conversation
 * 
 * @param userId - User ID
 * @param options - Optional generation parameters
 * @returns Suggestions with metadata
 * 
 * @example
 * ```typescript
 * // Generate suggestions after saving a prompt
 * const suggestions = await generateSuggestions('user_123', {
 *   promptId: 'prompt_456',
 *   trigger: 'prompt_save',
 *   limit: 5
 * });
 * 
 * suggestions.suggestions.forEach(s => {
 *   console.log(`${s.type}: ${s.title} - ${s.description}`);
 * });
 * ```
 */
export async function generateSuggestions(
  userId: string,
  options: {
    promptId?: string;
    conversationContext?: string;
    trigger?: 'manual' | 'prompt_save' | 'dojo_session' | 'page_load';
    limit?: number;
    includeTypes?: SuggestionType[];
  } = {}
): Promise<SuggestionsResponse> {
  const {
    promptId,
    trigger = 'manual',
    limit = 8,
    includeTypes = ['similar_prompt', 'recent_work'],
  } = options;

  const suggestions: Suggestion[] = [];

  if (includeTypes.includes('similar_prompt')) {
    const similarSuggestions = await generateSimilarPromptSuggestions(
      userId,
      promptId,
      Math.ceil(limit / 2)
    );
    suggestions.push(...similarSuggestions);
  }

  if (includeTypes.includes('recent_work')) {
    const recentSuggestions = await generateRecentWorkSuggestions(
      userId,
      Math.ceil(limit / 2),
      promptId
    );
    suggestions.push(...recentSuggestions);
  }

  if (includeTypes.includes('related_seed')) {
    const seedSuggestions = await generateRelatedSeedSuggestions(
      userId,
      options.conversationContext
    );
    suggestions.push(...seedSuggestions);
  }

  const sortedSuggestions = sortSuggestions(suggestions).slice(0, limit);

  return {
    suggestions: sortedSuggestions,
    context: {
      prompt_id: promptId,
      user_id: userId,
      trigger,
    },
    generated_at: new Date().toISOString(),
  };
}

/**
 * Generate similar prompt suggestions.
 * 
 * Uses semantic similarity to find prompts related to current work.
 * 
 * @param userId - User ID
 * @param promptId - Optional source prompt ID for similarity
 * @param limit - Maximum suggestions to generate
 * @returns Similar prompt suggestions
 */
async function generateSimilarPromptSuggestions(
  userId: string,
  promptId: string | undefined,
  limit: number
): Promise<Suggestion[]> {
  if (!promptId) {
    const db = await getDB();
    const result = await db.query(
      `SELECT id FROM prompts 
       WHERE user_id = $1 
         AND embedding IS NOT NULL 
       ORDER BY updated_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return [];
    }

    promptId = (result.rows[0] as { id: string }).id;
  }

  try {
    const similarPrompts = await findSimilarPrompts(
      promptId,
      userId,
      limit,
      0.4
    );

    return similarPrompts.map(prompt => ({
      type: 'similar_prompt' as const,
      title: prompt.title,
      description: `${(prompt.similarity * 100).toFixed(0)}% similar`,
      action: 'View',
      target_id: prompt.id,
      similarity: prompt.similarity,
      metadata: {
        status: prompt.status,
        tags: prompt.metadata.tags,
        updated_at: prompt.metadata.updated_at,
      },
    }));
  } catch (error) {
    console.warn('Error generating similar prompt suggestions:', error);
    return [];
  }
}

/**
 * Generate recent work suggestions.
 * 
 * Shows recently modified prompts for quick access.
 * 
 * @param userId - User ID
 * @param limit - Maximum suggestions to generate
 * @param excludePromptId - Optional prompt ID to exclude (current prompt)
 * @returns Recent work suggestions
 */
async function generateRecentWorkSuggestions(
  userId: string,
  limit: number,
  excludePromptId?: string
): Promise<Suggestion[]> {
  try {
    const db = await getDB();

    let sql = `
      SELECT p.id, p.title, p.status, p.updated_at, pm.tags
      FROM prompts p
      LEFT JOIN prompt_metadata pm ON pm.prompt_id = p.id
      WHERE p.user_id = $1
    `;

    const params: any[] = [userId];

    if (excludePromptId) {
      sql += ` AND p.id != $2`;
      params.push(excludePromptId);
    }

    sql += ` ORDER BY p.updated_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query(sql, params);

    const prompts = result.rows as Array<{
      id: string;
      title: string;
      status: PromptStatus;
      updated_at: string;
      tags: string[] | null;
    }>;

    return prompts.map(prompt => ({
      type: 'recent_work' as const,
      title: prompt.title,
      description: `Last edited ${formatRelativeTime(prompt.updated_at)}`,
      action: 'Open',
      target_id: prompt.id,
      metadata: {
        status: prompt.status,
        tags: prompt.tags,
        updated_at: prompt.updated_at,
      },
    }));
  } catch (error) {
    console.warn('Error generating recent work suggestions:', error);
    return [];
  }
}

/**
 * Generate related seed patch suggestions.
 * 
 * **Note:** Seed patches are not yet implemented in the database.
 * This function is a placeholder for future integration.
 * 
 * @param userId - User ID
 * @param conversationContext - Optional conversation text for context
 * @returns Related seed suggestions (currently empty)
 */
async function generateRelatedSeedSuggestions(
  userId: string,
  conversationContext?: string
): Promise<Suggestion[]> {
  // TODO: Implement when seed_patches table is added
  // For now, return empty array
  return [];
}

/**
 * Sort suggestions by priority.
 * 
 * Priority order:
 * 1. Similar prompts with high similarity (>0.85)
 * 2. Recent work (last 24 hours)
 * 3. Similar prompts with medium similarity (0.75-0.85)
 * 4. Older recent work
 * 
 * @param suggestions - Unsorted suggestions
 * @returns Sorted suggestions
 */
function sortSuggestions(suggestions: Suggestion[]): Suggestion[] {
  return suggestions.sort((a, b) => {
    const aScore = calculateSuggestionScore(a);
    const bScore = calculateSuggestionScore(b);
    return bScore - aScore;
  });
}

/**
 * Calculate priority score for a suggestion.
 * 
 * @param suggestion - Suggestion to score
 * @returns Priority score (higher = more important)
 */
function calculateSuggestionScore(suggestion: Suggestion): number {
  let score = 0;

  if (suggestion.type === 'similar_prompt' && suggestion.similarity) {
    score += suggestion.similarity * 100;

    if (suggestion.similarity > 0.85) {
      score += 50;
    }
  }

  if (suggestion.type === 'recent_work' && suggestion.metadata?.updated_at) {
    const hoursSinceUpdate = getHoursSinceTimestamp(suggestion.metadata.updated_at);

    if (hoursSinceUpdate < 24) {
      score += 80;
    } else if (hoursSinceUpdate < 168) {
      score += 40;
    } else {
      score += 20;
    }
  }

  if (suggestion.type === 'related_seed') {
    score += 60;
  }

  return score;
}

/**
 * Format timestamp as relative time.
 * 
 * @param timestamp - ISO timestamp
 * @returns Relative time string (e.g., "2 hours ago", "3 days ago")
 */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }
}

/**
 * Get hours since timestamp.
 * 
 * @param timestamp - ISO timestamp
 * @returns Hours elapsed
 */
function getHoursSinceTimestamp(timestamp: string): number {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  return diffMs / 3600000;
}

/**
 * Get suggestions for a specific prompt.
 * 
 * Convenience wrapper for generating suggestions based on a specific prompt.
 * 
 * @param promptId - Prompt ID
 * @param userId - User ID
 * @param limit - Maximum suggestions (default: 5)
 * @returns Suggestions response
 * 
 * @example
 * ```typescript
 * const suggestions = await getSuggestionsForPrompt('prompt_123', 'user_456');
 * console.log(`Found ${suggestions.suggestions.length} suggestions`);
 * ```
 */
export async function getSuggestionsForPrompt(
  promptId: string,
  userId: string,
  limit: number = 5
): Promise<SuggestionsResponse> {
  return generateSuggestions(userId, {
    promptId,
    trigger: 'prompt_save',
    limit,
  });
}

/**
 * Get suggestions for Librarian page load.
 * 
 * Provides a mix of recent work and relevant prompts when user opens Librarian.
 * 
 * @param userId - User ID
 * @param limit - Maximum suggestions (default: 8)
 * @returns Suggestions response
 * 
 * @example
 * ```typescript
 * const suggestions = await getSuggestionsForPageLoad('user_123');
 * // Display in Librarian UI
 * ```
 */
export async function getSuggestionsForPageLoad(
  userId: string,
  limit: number = 8
): Promise<SuggestionsResponse> {
  return generateSuggestions(userId, {
    trigger: 'page_load',
    limit,
  });
}
