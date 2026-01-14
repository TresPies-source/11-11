/**
 * Librarian Agent Handler
 * 
 * Handles search and retrieval queries routed by the Supervisor.
 * Integrates with semantic search, cost tracking, and handoff system.
 * 
 * @module lib/agents/librarian-handler
 */

import { semanticSearch, type SearchFilters, type SearchResponse } from '../librarian/search';
import { generateEmbedding } from '../librarian/embeddings';
import { MODEL_PRICING } from '../cost/constants';
import type { ChatMessage, AgentInvocationContext } from './types';
import { getDB } from '../pglite/client';
import { logEvent, isTraceActive } from '../harness/trace';

export interface LibrarianQuery {
  query: string;
  conversationContext: ChatMessage[];
  sessionId: string;
  userId?: string;
  filters?: SearchFilters;
}

export interface LibrarianResponse {
  results: SearchResponse['results'];
  query: string;
  count: number;
  filters: SearchFilters;
  duration_ms: number;
  suggestion?: ProactiveSuggestion;
  cost?: {
    tokens_used: number;
    cost_usd: number;
  };
}

export interface ProactiveSuggestion {
  type: 'similar_prompt' | 'related_seed' | 'recent_work';
  title: string;
  description: string;
  action: string;
  target_id: string;
}

export class LibrarianError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'LibrarianError';
  }
}

/**
 * Extract search query from user input.
 * Removes common search prefixes like "search for", "find", "show me".
 * 
 * @param userQuery - Raw user query
 * @returns Cleaned search query
 */
export function extractSearchQuery(userQuery: string): string {
  return userQuery
    .replace(/^(search\s+(for\s+)?|find\s+|show\s+me\s+|retrieve\s+|look\s+for\s+|discover\s+)/i, '')
    .trim();
}

/**
 * Generate proactive suggestions based on search results.
 * 
 * @param results - Search results
 * @param sessionId - Session identifier
 * @returns Proactive suggestion or undefined
 */
export async function generateProactiveSuggestion(
  results: SearchResponse['results'],
  sessionId: string
): Promise<ProactiveSuggestion | undefined> {
  // If we have high-quality results, suggest the top result
  if (results.length > 0 && results[0].similarity > 0.85) {
    return {
      type: 'similar_prompt',
      title: results[0].title,
      description: `${(results[0].similarity * 100).toFixed(0)}% match - highly relevant`,
      action: 'View',
      target_id: results[0].id,
    };
  }

  // If we have moderate results, suggest exploring recent work
  if (results.length > 0 && results[0].similarity > 0.7) {
    const db = await getDB();
    const recentPrompts = await db.query<{
      id: string;
      title: string;
      updated_at: string;
    }>(
      `SELECT id, title, updated_at 
       FROM prompts 
       WHERE status = 'active'
       ORDER BY updated_at DESC 
       LIMIT 1`
    );

    if (recentPrompts.rows.length > 0) {
      const recent = recentPrompts.rows[0];
      return {
        type: 'recent_work',
        title: recent.title,
        description: `Last edited ${formatRelativeTime(recent.updated_at)}`,
        action: 'Open',
        target_id: recent.id,
      };
    }
  }

  return undefined;
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * 
 * @param timestamp - ISO timestamp string
 * @returns Formatted relative time
 */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}

/**
 * Handle a Librarian query from the Supervisor.
 * 
 * This is the main entry point for the Librarian agent.
 * It processes search queries, executes semantic search, tracks costs,
 * and returns formatted results with proactive suggestions.
 * 
 * @param query - Librarian query with context
 * @returns Librarian response with results and metadata
 * @throws LibrarianError if search fails
 */
export async function handleLibrarianQuery(
  query: LibrarianQuery
): Promise<LibrarianResponse> {
  const startTime = Date.now();

  try {
    // Log activity start
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_START', 
        {
          agent_id: 'librarian',
          message: 'Searching library for relevant prompts...',
          progress: 0,
        },
        {
          parent_type: 'agent_operation',
          metadata: { query: query.query },
        }
      );
    }

    // Extract clean search query
    const searchQuery = extractSearchQuery(query.query);

    if (!searchQuery || searchQuery.trim().length === 0) {
      throw new LibrarianError(
        'Search query is empty after cleaning',
        'EMPTY_QUERY'
      );
    }

    // Merge user filters with defaults
    const filters: SearchFilters = {
      threshold: 0.7,
      limit: 10,
      status: 'active',
      ...query.filters,
    };

    // Log embedding generation progress
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'librarian',
          message: 'Generating query embedding...',
          progress: 20,
        },
        {
          parent_type: 'agent_operation',
        }
      );
    }

    // Execute semantic search
    const userId = query.userId || 'anonymous';
    
    // Log database search progress
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'librarian',
          message: 'Searching database...',
          progress: 50,
        },
        {
          parent_type: 'agent_operation',
        }
      );
    }
    
    const searchResponse = await semanticSearch(searchQuery, userId, filters);

    // Log ranking progress
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'librarian',
          message: 'Ranking results...',
          progress: 80,
        },
        {
          parent_type: 'agent_operation',
        }
      );
    }

    // Track cost (embedding generation)
    // Estimate tokens for the query (approximate 1 token per 4 characters)
    const estimatedTokens = Math.ceil(searchQuery.length / 4);
    const embeddingPricing = MODEL_PRICING['text-embedding-3-small'];
    const cost: { tokens_used: number; cost_usd: number } = {
      tokens_used: estimatedTokens,
      cost_usd: (estimatedTokens / 1_000_000) * embeddingPricing.input_price_per_1m,
    };

    // TODO: Integrate with Cost Guard for persistent cost tracking
    // if (query.userId) {
    //   await trackCostRecord(query.userId, query.sessionId, 'search', cost);
    // }

    // Generate proactive suggestions
    const suggestion = await generateProactiveSuggestion(
      searchResponse.results,
      query.sessionId
    );

    const duration = Date.now() - startTime;

    // Log completion
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE',
        {
          agent_id: 'librarian',
          message: `Found ${searchResponse.count} result${searchResponse.count !== 1 ? 's' : ''}`,
          progress: 100,
        },
        {
          parent_type: 'agent_operation',
          metadata: {
            result_count: searchResponse.count,
            duration_ms: duration,
          },
        }
      );
    }

    return {
      results: searchResponse.results,
      query: searchQuery,
      count: searchResponse.count,
      filters: searchResponse.filters,
      duration_ms: duration,
      suggestion,
      cost,
    };
  } catch (error) {
    // Log error
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE',
        {
          agent_id: 'librarian',
          message: 'Search failed',
          status: 'error',
        },
        {
          parent_type: 'agent_operation',
          metadata: {
            error: error instanceof Error ? error.message : String(error),
          },
        }
      );
    }

    if (error instanceof LibrarianError) {
      throw error;
    }

    throw new LibrarianError(
      `Search failed: ${error instanceof Error ? error.message : String(error)}`,
      'SEARCH_FAILED',
      error
    );
  }
}

/**
 * Handle Librarian agent invocation from handoff system.
 * 
 * This function is called when another agent hands off to the Librarian.
 * It extracts the user intent as the search query and executes the search.
 * 
 * @param context - Agent invocation context from handoff
 * @returns Librarian response
 */
export async function invokeLibrarianAgent(
  context: AgentInvocationContext
): Promise<LibrarianResponse> {
  const query: LibrarianQuery = {
    query: context.user_intent,
    conversationContext: context.conversation_history,
    sessionId: context.session_id,
  };

  const response = await handleLibrarianQuery(query);

  console.log(
    `[Librarian] Search completed: ${response.count} results in ${response.duration_ms}ms`
  );

  return response;
}

/**
 * Format Librarian response for user display.
 * 
 * Converts search results into a human-readable format suitable for chat responses.
 * 
 * @param response - Librarian response
 * @returns Formatted message string
 */
export function formatLibrarianResponse(response: LibrarianResponse): string {
  if (response.count === 0) {
    return `I couldn't find any prompts matching "${response.query}". Try using different keywords or broadening your search.`;
  }

  const resultsText = response.results
    .map((result, index) => {
      const matchPercent = (result.similarity * 100).toFixed(0);
      return `${index + 1}. **${result.title}** (${matchPercent}% match)\n   ${result.metadata.description || 'No description'}`;
    })
    .join('\n\n');

  let message = `Found ${response.count} result${response.count > 1 ? 's' : ''} for "${response.query}":\n\n${resultsText}`;

  if (response.suggestion) {
    message += `\n\n💡 **Suggestion**: ${response.suggestion.description} - "${response.suggestion.title}"`;
  }

  return message;
}

/**
 * Extract conversation context for search query enhancement.
 * 
 * Analyzes recent conversation messages to extract additional context
 * that can improve search relevance.
 * 
 * @param messages - Conversation history
 * @param limit - Maximum number of recent messages to consider
 * @returns Context string or undefined
 */
export function extractConversationContext(
  messages: ChatMessage[],
  limit: number = 3
): string | undefined {
  const recentMessages = messages.slice(-limit);
  
  if (recentMessages.length === 0) {
    return undefined;
  }

  const contextText = recentMessages
    .filter((msg) => msg.role === 'user')
    .map((msg) => msg.content)
    .join(' ');

  return contextText.trim() || undefined;
}
