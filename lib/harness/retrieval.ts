import {
  getTrace as dbGetTrace,
  getSessionTraces as dbGetSessionTraces,
  getUserTraces as dbGetUserTraces,
} from '../pglite/harness';
import type { HarnessTrace } from './types';

export async function getTrace(traceId: string): Promise<HarnessTrace | null> {
  if (!traceId || typeof traceId !== 'string') {
    throw new Error('Invalid trace_id: must be a non-empty string');
  }

  return await dbGetTrace(traceId);
}

export async function getSessionTraces(sessionId: string): Promise<HarnessTrace[]> {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Invalid session_id: must be a non-empty string');
  }

  return await dbGetSessionTraces(sessionId);
}

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
