/**
 * Embedding generation module for Librarian Agent.
 * 
 * Generates vector embeddings for prompts and seeds using OpenAI's text-embedding-3-small model.
 * Integrates with Cost Guard for cost tracking. Includes retry logic for rate limits and timeouts.
 * 
 * @module lib/librarian/embeddings
 */

import { getOpenAIClient, canUseOpenAI } from '@/lib/openai/client';
import {
  OpenAIRateLimitError,
  OpenAITimeoutError,
  OpenAIError,
  OpenAIAuthError,
} from '@/lib/openai/types';
import { trackCost } from '@/lib/cost/tracking';
import { calculateCost } from '@/lib/cost/estimation';
import { getDB } from '@/lib/pglite/client';
import { validateEmbedding } from './vector';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

export interface EmbeddingResult {
  embedding: number[];
  tokens_used: number;
  cost_usd: number;
  model: string;
}

export interface BatchEmbeddingResult {
  total_processed: number;
  total_tokens: number;
  total_cost_usd: number;
  errors: Array<{ id: string; error: string }>;
  duration_ms: number;
}

/**
 * Generate embedding vector for text using OpenAI's text-embedding-3-small model.
 * 
 * **Features:**
 * - Uses text-embedding-3-small (1536 dimensions, $0.02/1M tokens)
 * - Automatic retry on rate limit (3 attempts with exponential backoff)
 * - Validates embedding output (checks for NaN, correct dimensions)
 * - Returns tokens used and cost for tracking
 * 
 * **Error Handling:**
 * - OpenAIAuthError: Invalid or missing API key
 * - OpenAIRateLimitError: Rate limit exceeded (retries automatically)
 * - OpenAITimeoutError: Request timed out
 * - OpenAIError: Other OpenAI API errors
 * 
 * @param text - Text to generate embedding for
 * @param retryAttempts - Number of retry attempts on failure (default: 3)
 * @returns Embedding result with vector, tokens, and cost
 * 
 * @example
 * ```typescript
 * const result = await generateEmbedding("Budget planning for Q1");
 * console.log(`Embedding: ${result.embedding.length} dimensions`);
 * console.log(`Cost: $${result.cost_usd.toFixed(6)}`);
 * ```
 */
export async function generateEmbedding(
  text: string,
  retryAttempts: number = DEFAULT_RETRY_ATTEMPTS
): Promise<EmbeddingResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  if (!canUseOpenAI()) {
    throw new OpenAIAuthError('OpenAI API is not available. Check API key configuration.');
  }

  const client = getOpenAIClient();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retryAttempts; attempt++) {
    try {
      const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text.trim(),
        dimensions: EMBEDDING_DIMENSIONS,
      });

      const embedding = response.data[0].embedding;
      const tokensUsed = response.usage.total_tokens;

      if (!validateEmbedding(embedding)) {
        throw new Error('Generated embedding is invalid (contains NaN or wrong dimensions)');
      }

      if (embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`
        );
      }

      const costUsd = calculateCost(tokensUsed, 0, EMBEDDING_MODEL);

      return {
        embedding,
        tokens_used: tokensUsed,
        cost_usd: costUsd,
        model: EMBEDDING_MODEL,
      };
    } catch (error: any) {
      if (error?.status === 401 || error?.code === 'invalid_api_key') {
        throw new OpenAIAuthError('OpenAI API key is invalid');
      }

      if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
        lastError = new OpenAIRateLimitError('OpenAI rate limit exceeded');
        
        if (attempt < retryAttempts - 1) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(`[EMBEDDING] Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${retryAttempts})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      if (error?.status === 408 || error?.code === 'ETIMEDOUT') {
        lastError = new OpenAITimeoutError('OpenAI request timed out');
        
        if (attempt < retryAttempts - 1) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(`[EMBEDDING] Timeout, retrying in ${delay}ms (attempt ${attempt + 1}/${retryAttempts})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      throw new OpenAIError(
        error?.message || 'Unknown error generating embedding',
        error?.code,
        error?.status,
        error
      );
    }
  }

  throw lastError || new Error('Failed to generate embedding after retries');
}

/**
 * Generate embedding for a prompt and update database.
 * 
 * Generates embedding for the prompt content, updates the prompts table,
 * and tracks cost in Cost Guard system.
 * 
 * @param promptId - Prompt ID to embed
 * @param content - Prompt content
 * @param userId - User ID for cost tracking
 * @param sessionId - Optional session ID for cost tracking
 * @returns Embedding result
 * 
 * @example
 * ```typescript
 * const result = await embedPrompt(
 *   'prompt_123',
 *   'Help me create a budget plan',
 *   'user_456',
 *   'sess_abc'
 * );
 * console.log(`Embedded prompt ${promptId}: $${result.cost_usd.toFixed(6)}`);
 * ```
 */
export async function embedPrompt(
  promptId: string,
  content: string,
  userId: string,
  sessionId?: string
): Promise<EmbeddingResult> {
  const embeddingResult = await generateEmbedding(content);

  const db = await getDB();
  await db.query(
    'UPDATE prompts SET embedding = $1 WHERE id = $2',
    [JSON.stringify(embeddingResult.embedding), promptId]
  );

  await trackCost({
    user_id: userId,
    session_id: sessionId || null,
    query_id: null,
    model: EMBEDDING_MODEL,
    prompt_tokens: embeddingResult.tokens_used,
    completion_tokens: 0,
    total_tokens: embeddingResult.tokens_used,
    cost_usd: embeddingResult.cost_usd,
    operation_type: 'search',
  });

  console.log(`[EMBEDDING] Embedded prompt ${promptId}: ${embeddingResult.tokens_used} tokens, $${embeddingResult.cost_usd.toFixed(6)}`);

  return embeddingResult;
}

/**
 * Batch embed all prompts without embeddings.
 * 
 * Processes prompts in batches to avoid overwhelming the API.
 * Tracks progress and errors. Safe to run multiple times (skips already embedded prompts).
 * 
 * **Performance Target:** <2 minutes for 100 prompts
 * 
 * @param userId - User ID for cost tracking
 * @param batchSize - Number of prompts to process per batch (default: 10)
 * @returns Batch embedding result with stats
 * 
 * @example
 * ```typescript
 * const result = await embedAllPrompts('user_123', 10);
 * console.log(`Embedded ${result.total_processed} prompts`);
 * console.log(`Total cost: $${result.total_cost_usd.toFixed(4)}`);
 * console.log(`Duration: ${(result.duration_ms / 1000).toFixed(1)}s`);
 * ```
 */
export async function embedAllPrompts(
  userId: string,
  batchSize: number = 10
): Promise<BatchEmbeddingResult> {
  const startTime = performance.now();
  const db = await getDB();

  const result = await db.query(
    'SELECT id, content FROM prompts WHERE user_id = $1 AND embedding IS NULL ORDER BY created_at DESC',
    [userId]
  );

  const prompts = result.rows as Array<{ id: string; content: string }>;

  if (prompts.length === 0) {
    return {
      total_processed: 0,
      total_tokens: 0,
      total_cost_usd: 0,
      errors: [],
      duration_ms: performance.now() - startTime,
    };
  }

  console.log(`[BATCH_EMBEDDING] Starting batch embedding for ${prompts.length} prompts (batch size: ${batchSize})`);

  let totalTokens = 0;
  let totalCost = 0;
  let processedCount = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    
    for (const prompt of batch) {
      try {
        const embeddingResult = await embedPrompt(
          prompt.id,
          prompt.content,
          userId
        );

        totalTokens += embeddingResult.tokens_used;
        totalCost += embeddingResult.cost_usd;
        processedCount++;

        if (processedCount % 10 === 0) {
          console.log(`[BATCH_EMBEDDING] Progress: ${processedCount}/${prompts.length} (${((processedCount / prompts.length) * 100).toFixed(1)}%)`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[BATCH_EMBEDDING] Failed to embed prompt ${prompt.id}:`, errorMessage);
        errors.push({ id: prompt.id, error: errorMessage });
      }
    }

    if (i + batchSize < prompts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const durationMs = performance.now() - startTime;

  console.log(`[BATCH_EMBEDDING] Completed: ${processedCount}/${prompts.length} prompts in ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`[BATCH_EMBEDDING] Total tokens: ${totalTokens}, Total cost: $${totalCost.toFixed(4)}`);

  if (errors.length > 0) {
    console.warn(`[BATCH_EMBEDDING] ${errors.length} errors occurred`);
  }

  return {
    total_processed: processedCount,
    total_tokens: totalTokens,
    total_cost_usd: totalCost,
    errors,
    duration_ms: durationMs,
  };
}

/**
 * Check if a prompt already has an embedding.
 * 
 * @param promptId - Prompt ID to check
 * @returns True if prompt has embedding, false otherwise
 */
export async function hasEmbedding(promptId: string): Promise<boolean> {
  const db = await getDB();
  const result = await db.query(
    'SELECT embedding FROM prompts WHERE id = $1',
    [promptId]
  );

  if (result.rows.length === 0) {
    return false;
  }

  const row = result.rows[0] as { embedding: number[] | null };
  return row.embedding !== null && row.embedding.length > 0;
}

/**
 * Refresh embedding for a prompt (regenerate if content changed).
 * 
 * @param promptId - Prompt ID to refresh
 * @param content - New prompt content
 * @param userId - User ID for cost tracking
 * @param sessionId - Optional session ID for cost tracking
 * @returns Embedding result
 */
export async function refreshEmbedding(
  promptId: string,
  content: string,
  userId: string,
  sessionId?: string
): Promise<EmbeddingResult> {
  console.log(`[EMBEDDING] Refreshing embedding for prompt ${promptId}`);
  return await embedPrompt(promptId, content, userId, sessionId);
}
