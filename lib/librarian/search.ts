/**
 * Semantic search module for Librarian Agent.
 * 
 * Provides vector-based semantic search across prompts using embeddings and cosine similarity.
 * Supports filtering by status, tags, and similarity threshold. Tracks search history for analytics.
 * 
 * @module lib/librarian/search
 */

import { getDB } from '@/lib/pglite/client';
import { generateEmbedding } from './embeddings';
import { cosineSimilarity, rankBySimilarity } from './vector';
import type { PromptRow, PromptStatus, SearchHistoryInsert } from '@/lib/pglite/types';

export interface SearchFilters {
  status?: PromptStatus | PromptStatus[];
  tags?: string[];
  threshold?: number;
  limit?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  similarity: number;
  status: PromptStatus;
  metadata: {
    description: string | null;
    tags: string[] | null;
    author: string | null;
    created_at: string;
    updated_at: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  count: number;
  filters: SearchFilters;
  duration_ms: number;
}

/**
 * Perform semantic search across prompts using vector similarity.
 * 
 * **Features:**
 * - Vector-based semantic search (cosine similarity)
 * - Filtering by status, tags, and threshold
 * - Search history tracking
 * - Performance target: <300ms (p95)
 * 
 * **Performance Optimization:**
 * - Uses JavaScript-based cosine similarity (faster than SQL for small datasets)
 * - Filters in-memory after retrieval (PGlite is local, fetching all is fast)
 * - Only fetches prompts with embeddings
 * 
 * @param query - Search query text
 * @param userId - User ID (search scoped to user's prompts)
 * @param filters - Optional search filters
 * @returns Search results with similarity scores
 * 
 * @example
 * ```typescript
 * const results = await semanticSearch(
 *   "budget planning prompts",
 *   "user_123",
 *   { status: 'active', threshold: 0.7, limit: 10 }
 * );
 * 
 * console.log(`Found ${results.count} results in ${results.duration_ms}ms`);
 * results.results.forEach(r => {
 *   console.log(`${r.title} (${(r.similarity * 100).toFixed(0)}% match)`);
 * });
 * ```
 */
export async function semanticSearch(
  query: string,
  userId: string,
  filters: SearchFilters = {}
): Promise<SearchResponse> {
  const startTime = performance.now();

  if (!query || query.trim().length === 0) {
    return {
      results: [],
      query: '',
      count: 0,
      filters,
      duration_ms: performance.now() - startTime,
    };
  }

  const threshold = filters.threshold ?? 0.7;
  const limit = filters.limit ?? 10;

  const queryEmbedding = await generateEmbedding(query.trim());

  const db = await getDB();

  let sql = `
    SELECT 
      p.id,
      p.title,
      p.content,
      p.status,
      p.embedding,
      p.created_at,
      p.updated_at,
      pm.description,
      pm.tags,
      pm.author
    FROM prompts p
    LEFT JOIN prompt_metadata pm ON pm.prompt_id = p.id
    WHERE p.user_id = $1 
      AND p.embedding IS NOT NULL
  `;

  const params: any[] = [userId];
  let paramCount = 2;

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      sql += ` AND p.status = ANY($${paramCount})`;
      params.push(filters.status);
    } else {
      sql += ` AND p.status = $${paramCount}`;
      params.push(filters.status);
    }
    paramCount++;
  }

  if (filters.tags && filters.tags.length > 0) {
    sql += ` AND pm.tags && $${paramCount}`;
    params.push(filters.tags);
    paramCount++;
  }

  const result = await db.query(sql, params);

  const prompts = result.rows as Array<{
    id: string;
    title: string;
    content: string;
    status: PromptStatus;
    embedding: number[] | null;
    created_at: string;
    updated_at: string;
    description: string | null;
    tags: string[] | null;
    author: string | null;
  }>;

  const rankedResults = rankBySimilarity(
    queryEmbedding.embedding,
    prompts.map(p => ({
      id: p.id,
      embedding: p.embedding,
    })),
    threshold
  );

  const topResults = rankedResults.slice(0, limit);

  const searchResults: SearchResult[] = topResults.map(ranked => {
    const prompt = prompts.find(p => p.id === ranked.id)!;
    return {
      id: prompt.id,
      title: prompt.title,
      content: prompt.content,
      similarity: ranked.similarity,
      status: prompt.status,
      metadata: {
        description: prompt.description,
        tags: prompt.tags,
        author: prompt.author,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at,
      },
    };
  });

  const durationMs = performance.now() - startTime;

  await trackSearchHistory(userId, query, searchResults.length, filters);

  return {
    results: searchResults,
    query: query.trim(),
    count: searchResults.length,
    filters,
    duration_ms: durationMs,
  };
}

/**
 * Track search query in search history for analytics.
 * 
 * @param userId - User ID
 * @param query - Search query
 * @param resultsCount - Number of results found
 * @param filters - Search filters applied
 */
async function trackSearchHistory(
  userId: string,
  query: string,
  resultsCount: number,
  filters: SearchFilters
): Promise<void> {
  const db = await getDB();

  const historyEntry: SearchHistoryInsert = {
    user_id: userId,
    query,
    results_count: resultsCount,
    filters: filters as Record<string, any>,
  };

  await db.query(
    `INSERT INTO search_history (user_id, query, results_count, filters)
     VALUES ($1, $2, $3, $4)`,
    [
      historyEntry.user_id,
      historyEntry.query,
      historyEntry.results_count,
      JSON.stringify(historyEntry.filters),
    ]
  );
}

/**
 * Get recent search queries for a user.
 * 
 * @param userId - User ID
 * @param limit - Maximum number of searches to return (default: 10)
 * @returns Recent search queries
 * 
 * @example
 * ```typescript
 * const recent = await getRecentSearches('user_123', 5);
 * recent.forEach(s => {
 *   console.log(`"${s.query}" - ${s.results_count} results`);
 * });
 * ```
 */
export async function getRecentSearches(
  userId: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  query: string;
  results_count: number;
  filters: Record<string, any>;
  created_at: string;
}>> {
  const db = await getDB();

  const result = await db.query(
    `SELECT id, query, results_count, filters, created_at
     FROM search_history
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows as Array<{
    id: string;
    query: string;
    results_count: number;
    filters: Record<string, any>;
    created_at: string;
  }>;
}

/**
 * Find similar prompts to a given prompt.
 * 
 * Uses the prompt's embedding to find semantically similar prompts.
 * Useful for "Related prompts" features.
 * 
 * @param promptId - Source prompt ID
 * @param userId - User ID (search scoped to user's prompts)
 * @param limit - Maximum number of similar prompts to return (default: 5)
 * @param threshold - Minimum similarity threshold (default: 0.75)
 * @returns Similar prompts with similarity scores
 * 
 * @example
 * ```typescript
 * const similar = await findSimilarPrompts('prompt_123', 'user_456', 5, 0.8);
 * similar.forEach(p => {
 *   console.log(`${p.title} (${(p.similarity * 100).toFixed(0)}% similar)`);
 * });
 * ```
 */
export async function findSimilarPrompts(
  promptId: string,
  userId: string,
  limit: number = 5,
  threshold: number = 0.75
): Promise<SearchResult[]> {
  const db = await getDB();

  const sourceResult = await db.query(
    'SELECT embedding FROM prompts WHERE id = $1 AND user_id = $2',
    [promptId, userId]
  );

  if (sourceResult.rows.length === 0) {
    return [];
  }

  const sourceRow = sourceResult.rows[0] as { embedding: number[] | null };
  if (!sourceRow.embedding) {
    return [];
  }

  const allPromptsResult = await db.query(
    `SELECT 
      p.id,
      p.title,
      p.content,
      p.status,
      p.embedding,
      p.created_at,
      p.updated_at,
      pm.description,
      pm.tags,
      pm.author
     FROM prompts p
     LEFT JOIN prompt_metadata pm ON pm.prompt_id = p.id
     WHERE p.user_id = $1 
       AND p.id != $2 
       AND p.embedding IS NOT NULL`,
    [userId, promptId]
  );

  const prompts = allPromptsResult.rows as Array<{
    id: string;
    title: string;
    content: string;
    status: PromptStatus;
    embedding: number[] | null;
    created_at: string;
    updated_at: string;
    description: string | null;
    tags: string[] | null;
    author: string | null;
  }>;

  const rankedResults = rankBySimilarity(
    sourceRow.embedding,
    prompts.map(p => ({
      id: p.id,
      embedding: p.embedding,
    })),
    threshold
  );

  const topResults = rankedResults.slice(0, limit);

  return topResults.map(ranked => {
    const prompt = prompts.find(p => p.id === ranked.id)!;
    return {
      id: prompt.id,
      title: prompt.title,
      content: prompt.content,
      similarity: ranked.similarity,
      status: prompt.status,
      metadata: {
        description: prompt.description,
        tags: prompt.tags,
        author: prompt.author,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at,
      },
    };
  });
}

/**
 * Get search analytics for a user.
 * 
 * @param userId - User ID
 * @returns Search analytics
 * 
 * @example
 * ```typescript
 * const stats = await getSearchAnalytics('user_123');
 * console.log(`Total searches: ${stats.total_searches}`);
 * console.log(`Avg results: ${stats.avg_results_per_search.toFixed(1)}`);
 * ```
 */
export async function getSearchAnalytics(userId: string): Promise<{
  total_searches: number;
  avg_results_per_search: number;
  most_common_queries: Array<{ query: string; count: number }>;
}> {
  const db = await getDB();

  const totalResult = await db.query(
    'SELECT COUNT(*) as total, AVG(results_count) as avg_results FROM search_history WHERE user_id = $1',
    [userId]
  );

  const totalRow = totalResult.rows[0] as { total: number; avg_results: number };

  const topQueriesResult = await db.query(
    `SELECT query, COUNT(*) as count
     FROM search_history
     WHERE user_id = $1
     GROUP BY query
     ORDER BY count DESC
     LIMIT 5`,
    [userId]
  );

  return {
    total_searches: Number(totalRow.total || 0),
    avg_results_per_search: Number(totalRow.avg_results || 0),
    most_common_queries: topQueriesResult.rows as Array<{ query: string; count: number }>,
  };
}
