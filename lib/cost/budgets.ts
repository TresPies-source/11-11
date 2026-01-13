/**
 * Budget checking module for Cost Guard system.
 * 
 * Implements three-tier budgeting (query, session, user) following Dataiku's
 * Cost Guard pattern. Prevents runaway costs through proactive budget enforcement.
 * 
 * @module lib/cost/budgets
 */

import { DEFAULT_BUDGET } from './constants';
import type { BudgetCheckResult, BudgetConfig } from './types';
import { getSessionTokenUsage, getUserMonthlyTokenUsage } from '../pglite/cost';

/**
 * Check if an LLM call is allowed based on three-tier budget constraints.
 * 
 * Performs hierarchical budget checks in order:
 * 1. Query-level: Prevents single expensive queries (10K tokens default)
 * 2. Session-level: Prevents long conversations (50K tokens default)
 * 3. User-level: Prevents monthly overruns (500K tokens default)
 * 
 * **Thresholds:**
 * - Warn at 80% (warns but allows)
 * - Hard stop at 100% (rejects query)
 * 
 * **Edge Cases Handled:**
 * - New users (no monthly usage record)
 * - No session ID (user-level only)
 * - Month rollover (automatic new record)
 * - Database errors (logged, graceful fallback)
 * 
 * @param userId - User ID for monthly budget lookup
 * @param estimatedTokens - Estimated tokens for this query
 * @param sessionId - Optional session ID for session budget lookup
 * @param config - Optional custom budget configuration (defaults to DEFAULT_BUDGET)
 * @returns Budget check result with allowed flag, warnings, and reason if rejected
 * 
 * @example
 * ```typescript
 * const result = await checkBudget('user_123', 2450, 'sess_abc');
 * if (!result.allowed) {
 *   throw new Error(`Budget exceeded: ${result.reason}`);
 * }
 * if (result.warnings.length > 0) {
 *   console.warn(`Budget warnings: ${result.warnings.join(', ')}`);
 * }
 * ```
 */
export async function checkBudget(
  userId: string,
  estimatedTokens: number,
  sessionId?: string | null,
  config: BudgetConfig = DEFAULT_BUDGET
): Promise<BudgetCheckResult> {
  const warnings: string[] = [];

  if (estimatedTokens <= 0) {
    return {
      allowed: true,
      warnings: [],
    };
  }

  if (estimatedTokens > config.query_limit * config.stop_threshold) {
    return {
      allowed: false,
      reason: 'query_limit_exceeded',
      limit: config.query_limit,
      estimated: estimatedTokens,
    };
  }

  if (estimatedTokens > config.query_limit * config.warn_threshold) {
    warnings.push('query_approaching_limit');
  }

  if (sessionId) {
    const sessionUsage = await getSessionTokenUsage(sessionId);
    const sessionTotal = sessionUsage + estimatedTokens;

    if (sessionTotal > config.session_limit * config.stop_threshold) {
      return {
        allowed: false,
        reason: 'session_limit_exceeded',
        limit: config.session_limit,
        current: sessionUsage,
        estimated: estimatedTokens,
      };
    }

    if (sessionTotal > config.session_limit * config.warn_threshold) {
      warnings.push('session_approaching_limit');
    }
  }

  const userUsage = await getUserMonthlyTokenUsage(userId);
  const userTotal = userUsage + estimatedTokens;

  if (userTotal > config.user_monthly_limit * config.stop_threshold) {
    return {
      allowed: false,
      reason: 'user_limit_exceeded',
      limit: config.user_monthly_limit,
      current: userUsage,
      estimated: estimatedTokens,
    };
  }

  if (userTotal > config.user_monthly_limit * config.warn_threshold) {
    warnings.push('user_approaching_limit');
  }

  return {
    allowed: true,
    warnings,
  };
}

/**
 * Format a budget error message for user display.
 * 
 * Converts BudgetCheckResult into a user-friendly error message.
 * Returns empty string if budget check passed.
 * 
 * @param result - Budget check result
 * @returns Formatted error message or empty string
 * 
 * @example
 * ```typescript
 * const result = await checkBudget(userId, 15000);
 * if (!result.allowed) {
 *   const errorMsg = formatBudgetError(result);
 *   alert(errorMsg); // "Query budget exceeded: Estimated 15000 tokens exceeds limit of 10000 tokens."
 * }
 * ```
 */
export function formatBudgetError(result: BudgetCheckResult): string {
  if (result.allowed) {
    return '';
  }

  switch (result.reason) {
    case 'query_limit_exceeded':
      return `Query budget exceeded: Estimated ${result.estimated} tokens exceeds limit of ${result.limit} tokens.`;
    case 'session_limit_exceeded':
      return `Session budget exceeded: Current usage ${result.current} + estimated ${result.estimated} exceeds limit of ${result.limit} tokens.`;
    case 'user_limit_exceeded':
      return `Monthly budget exceeded: Current usage ${result.current} + estimated ${result.estimated} exceeds limit of ${result.limit} tokens.`;
    default:
      return 'Budget limit exceeded.';
  }
}

/**
 * Format budget warnings for user display.
 * 
 * Converts warning codes into user-friendly messages.
 * 
 * @param warnings - Array of warning codes from BudgetCheckResult
 * @returns Array of formatted warning messages
 * 
 * @example
 * ```typescript
 * const result = await checkBudget(userId, 9000);
 * if (result.warnings.length > 0) {
 *   const messages = formatBudgetWarnings(result.warnings);
 *   messages.forEach(msg => console.warn(msg));
 *   // "Warning: Query is approaching the budget limit (>80%)."
 * }
 * ```
 */
export function formatBudgetWarnings(warnings: string[]): string[] {
  return warnings.map((warning) => {
    switch (warning) {
      case 'query_approaching_limit':
        return `Warning: Query is approaching the budget limit (>80%).`;
      case 'session_approaching_limit':
        return `Warning: Session is approaching the budget limit (>80%).`;
      case 'user_approaching_limit':
        return `Warning: You are approaching your monthly budget limit (>80%).`;
      default:
        return `Warning: ${warning}`;
    }
  });
}
