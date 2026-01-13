/**
 * Harness Trace Retrieval API
 * 
 * Provides functions for querying traces from the database.
 * 
 * @module harness/retrieval
 */

import {
  getTrace as dbGetTrace,
  getSessionTraces as dbGetSessionTraces,
  getUserTraces as dbGetUserTraces,
} from '../pglite/harness';
import type { HarnessTrace } from './types';

/**
 * Retrieves a single trace by its trace_id.
 * 
 * @param traceId - Unique trace ID (e.g., "trace_1234567890_abc123def")
 * @returns The trace if found, null otherwise
 * @throws Error if traceId is invalid
 * 
 * @example
 * ```ts
 * const trace = await getTrace('trace_1234567890_abc123def');
 * if (trace) {
 *   console.log(trace.summary.total_events);
 * }
 * ```
 */
export async function getTrace(traceId: string): Promise<HarnessTrace | null> {
  if (!traceId || typeof traceId !== 'string') {
    throw new Error('Invalid trace_id: must be a non-empty string');
  }

  return await dbGetTrace(traceId);
}

/**
 * Retrieves all traces for a given session.
 * 
 * @param sessionId - Session ID (e.g., "sess_xyz789")
 * @returns Array of traces for the session (empty if none found)
 * @throws Error if sessionId is invalid
 * 
 * @example
 * ```ts
 * const traces = await getSessionTraces('sess_xyz789');
 * console.log(`Session has ${traces.length} traces`);
 * ```
 */
export async function getSessionTraces(sessionId: string): Promise<HarnessTrace[]> {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Invalid session_id: must be a non-empty string');
  }

  return await dbGetSessionTraces(sessionId);
}

/**
 * Retrieves recent traces for a given user.
 * 
 * Results are ordered by started_at descending (newest first).
 * 
 * @param userId - User ID (e.g., "user_456")
 * @param limit - Maximum number of traces to return (default: 10, max: 100)
 * @returns Array of recent traces (empty if none found)
 * @throws Error if userId or limit is invalid
 * 
 * @example
 * ```ts
 * const recentTraces = await getUserTraces('user_456', 20);
 * console.log(`User has ${recentTraces.length} recent traces`);
 * ```
 */
export async function getUserTraces(
  userId: string,
  limit: number = 10
): Promise<HarnessTrace[]> {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user_id: must be a non-empty string');
  }

  if (typeof limit !== 'number' || limit < 1 || limit > 100) {
    throw new Error('Invalid limit: must be between 1 and 100');
  }

  return await dbGetUserTraces(userId, limit);
}
