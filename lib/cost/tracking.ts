/**
 * Cost tracking module for Cost Guard system.
 * 
 * Logs actual token usage and costs after LLM calls, updating session and
 * user monthly totals automatically. Handles month rollover gracefully.
 * 
 * @module lib/cost/tracking
 */

import {
  insertCostRecord,
  updateSessionUsage,
  upsertUserMonthlyUsage,
  getCurrentMonth,
} from '@/lib/pglite/cost';
import type { CostRecordInsert } from '@/lib/pglite/types';
import { logEvent, isTraceActive } from '@/lib/harness/trace';

export { getCurrentMonth };

export interface TrackCostInput {
  user_id: string;
  session_id?: string | null;
  query_id?: string | null;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  operation_type: 'routing' | 'agent_execution' | 'search' | 'critique' | 'other';
}

export interface TrackCostResult {
  success: boolean;
  cost_record_id?: string;
  session_total_tokens?: number;
  user_monthly_total_tokens?: number;
  error?: string;
}

/**
 * Track actual token usage and cost after an LLM call.
 * 
 * This function:
 * 1. Inserts a cost record into the database
 * 2. Updates session totals (if session_id provided)
 * 3. Upserts user monthly totals (creates new record on month rollover)
 * 4. Logs the cost event to console
 * 
 * **Error Handling:**
 * - Database failures are logged but don't throw errors
 * - Graceful degradation ensures LLM calls aren't blocked by tracking failures
 * - Returns success: false with error message on failure
 * 
 * **Month Rollover:**
 * - Automatically creates new user_monthly_usage record when month changes
 * - Uses YYYY-MM format for month (e.g., '2026-01')
 * 
 * @param input - Cost tracking input with tokens, cost, and metadata
 * @returns Result with success flag and updated totals
 * 
 * @example
 * ```typescript
 * const result = await trackCost({
 *   user_id: 'user_123',
 *   session_id: 'sess_abc',
 *   query_id: 'query_xyz',
 *   model: 'gpt-4o',
 *   prompt_tokens: 450,
 *   completion_tokens: 1800,
 *   total_tokens: 2250,
 *   cost_usd: 0.019125,
 *   operation_type: 'agent_execution'
 * });
 * console.log(`New session total: ${result.session_total_tokens} tokens`);
 * ```
 */
export async function trackCost(input: TrackCostInput): Promise<TrackCostResult> {
  try {
    if (isTraceActive()) {
      logEvent('COST_TRACKED', {
        operation: input.operation_type,
        model: input.model,
      }, {
        tokens: input.total_tokens,
        cost: input.cost_usd,
        prompt_tokens: input.prompt_tokens,
        completion_tokens: input.completion_tokens,
      }, {
        token_count: input.total_tokens,
        cost_usd: input.cost_usd,
      });
    }

    const costRecord: CostRecordInsert = {
      user_id: input.user_id,
      session_id: input.session_id || null,
      query_id: input.query_id || null,
      model: input.model,
      prompt_tokens: input.prompt_tokens,
      completion_tokens: input.completion_tokens,
      total_tokens: input.total_tokens,
      cost_usd: input.cost_usd,
      operation_type: input.operation_type,
    };

    const insertedRecord = await insertCostRecord(costRecord);

    let sessionTotalTokens: number | undefined;
    let userMonthlyTotalTokens: number | undefined;

    if (input.session_id) {
      try {
        await updateSessionUsage(
          input.session_id,
          input.total_tokens,
          input.cost_usd
        );
        
        const db = await import('@/lib/pglite/client').then(m => m.getDB());
        const sessionResult = await db.query(
          'SELECT total_tokens FROM sessions WHERE id = $1',
          [input.session_id]
        );
        if (sessionResult.rows.length > 0) {
          sessionTotalTokens = (sessionResult.rows[0] as any).total_tokens;
        }
      } catch (error) {
        console.error('[COST_TRACKING] Failed to update session usage:', error);
      }
    }

    try {
      const currentMonth = getCurrentMonth();
      await upsertUserMonthlyUsage(
        input.user_id,
        currentMonth,
        input.total_tokens,
        input.cost_usd
      );

      const db = await import('@/lib/pglite/client').then(m => m.getDB());
      const userResult = await db.query(
        'SELECT total_tokens FROM user_monthly_usage WHERE user_id = $1 AND month = $2',
        [input.user_id, currentMonth]
      );
      if (userResult.rows.length > 0) {
        userMonthlyTotalTokens = (userResult.rows[0] as any).total_tokens;
      }
    } catch (error) {
      console.error('[COST_TRACKING] Failed to update user monthly usage:', error);
    }

    console.log('[COST_TRACKED]', {
      id: insertedRecord.id,
      user_id: input.user_id,
      session_id: input.session_id,
      tokens: input.total_tokens,
      cost: input.cost_usd,
      operation: input.operation_type,
      model: input.model,
    });

    return {
      success: true,
      cost_record_id: insertedRecord.id,
      session_total_tokens: sessionTotalTokens,
      user_monthly_total_tokens: userMonthlyTotalTokens,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[COST_TRACKING] Failed to track cost:', errorMessage, error);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get cumulative token usage and cost for a session.
 * 
 * Queries the sessions table for total_tokens and total_cost_usd.
 * Returns zeros if session not found or on error.
 * 
 * @param sessionId - Session ID to look up
 * @returns Session totals (tokens and cost in USD)
 * 
 * @example
 * ```typescript
 * const totals = await getSessionTotalUsage('sess_abc');
 * console.log(`Session used ${totals.total_tokens} tokens ($${totals.total_cost_usd})`);
 * ```
 */
export async function getSessionTotalUsage(sessionId: string): Promise<{
  total_tokens: number;
  total_cost_usd: number;
}> {
  try {
    const db = await import('@/lib/pglite/client').then(m => m.getDB());
    const result = await db.query(
      'SELECT total_tokens, total_cost_usd FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) {
      return { total_tokens: 0, total_cost_usd: 0 };
    }

    const row = result.rows[0] as any;
    return {
      total_tokens: row.total_tokens || 0,
      total_cost_usd: parseFloat(row.total_cost_usd || '0'),
    };
  } catch (error) {
    console.error('[COST_TRACKING] Failed to get session total usage:', error);
    return { total_tokens: 0, total_cost_usd: 0 };
  }
}

/**
 * Get cumulative token usage and cost for a user in a given month.
 * 
 * Queries user_monthly_usage table. If month not specified, uses current month.
 * Returns zeros if no usage record found (new user or new month).
 * 
 * @param userId - User ID to look up
 * @param month - Optional month string (YYYY-MM format). Defaults to current month.
 * @returns User monthly totals (tokens and cost in USD)
 * 
 * @example
 * ```typescript
 * // Get current month usage
 * const totals = await getUserMonthlyTotalUsage('user_123');
 * console.log(`This month: ${totals.total_tokens} tokens ($${totals.total_cost_usd})`);
 * 
 * // Get specific month usage
 * const decTotals = await getUserMonthlyTotalUsage('user_123', '2025-12');
 * ```
 */
export async function getUserMonthlyTotalUsage(
  userId: string,
  month?: string
): Promise<{
  total_tokens: number;
  total_cost_usd: number;
}> {
  try {
    const targetMonth = month || getCurrentMonth();
    const db = await import('@/lib/pglite/client').then(m => m.getDB());
    const result = await db.query(
      'SELECT total_tokens, total_cost_usd FROM user_monthly_usage WHERE user_id = $1 AND month = $2',
      [userId, targetMonth]
    );

    if (result.rows.length === 0) {
      return { total_tokens: 0, total_cost_usd: 0 };
    }

    const row = result.rows[0] as any;
    return {
      total_tokens: row.total_tokens || 0,
      total_cost_usd: parseFloat(row.total_cost_usd || '0'),
    };
  } catch (error) {
    console.error('[COST_TRACKING] Failed to get user monthly total usage:', error);
    return { total_tokens: 0, total_cost_usd: 0 };
  }
}
