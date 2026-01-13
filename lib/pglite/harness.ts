import { getDB } from './client';
import type { HarnessTrace } from '../harness/types';
import type { HarnessTraceRow, HarnessTraceInsert } from './types';

export async function insertTrace(trace: HarnessTrace): Promise<void> {
  try {
    const db = await getDB();
    
    const insert: HarnessTraceInsert = {
      trace_id: trace.trace_id,
      session_id: trace.session_id,
      user_id: trace.user_id,
      started_at: trace.started_at,
      ended_at: trace.ended_at,
      events: JSON.stringify(trace.events),
      summary: JSON.stringify(trace.summary),
    };
    
    await db.query(
      `INSERT INTO harness_traces (trace_id, session_id, user_id, started_at, ended_at, events, summary)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)`,
      [
        insert.trace_id,
        insert.session_id,
        insert.user_id,
        insert.started_at,
        insert.ended_at,
        insert.events,
        insert.summary,
      ]
    );
    
    console.log(`[HARNESS_DB] Inserted trace ${trace.trace_id}`);
  } catch (error) {
    console.error('[HARNESS_DB] Error inserting trace:', error);
    console.error('[HARNESS_DB] Falling back to console logging...');
    console.log('[HARNESS_TRACE_FALLBACK]', JSON.stringify(trace, null, 2));
  }
}

export async function getTrace(traceId: string): Promise<HarnessTrace | null> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      `SELECT * FROM harness_traces WHERE trace_id = $1`,
      [traceId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0] as HarnessTraceRow;
    
    return {
      trace_id: row.trace_id,
      session_id: row.session_id,
      user_id: row.user_id,
      started_at: row.started_at,
      ended_at: row.ended_at,
      events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events,
      summary: typeof row.summary === 'string' ? JSON.parse(row.summary) : row.summary,
    };
  } catch (error) {
    console.error('[HARNESS_DB] Error getting trace:', error);
    throw error;
  }
}

export async function getSessionTraces(sessionId: string): Promise<HarnessTrace[]> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      `SELECT * FROM harness_traces WHERE session_id = $1 ORDER BY started_at DESC`,
      [sessionId]
    );
    
    return (result.rows as HarnessTraceRow[]).map((row) => ({
      trace_id: row.trace_id,
      session_id: row.session_id,
      user_id: row.user_id,
      started_at: row.started_at,
      ended_at: row.ended_at,
      events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events,
      summary: typeof row.summary === 'string' ? JSON.parse(row.summary) : row.summary,
    }));
  } catch (error) {
    console.error('[HARNESS_DB] Error getting session traces:', error);
    throw error;
  }
}

export async function getUserTraces(
  userId: string,
  limit: number = 10
): Promise<HarnessTrace[]> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      `SELECT * FROM harness_traces WHERE user_id = $1 ORDER BY started_at DESC LIMIT $2`,
      [userId, limit]
    );
    
    return (result.rows as HarnessTraceRow[]).map((row) => ({
      trace_id: row.trace_id,
      session_id: row.session_id,
      user_id: row.user_id,
      started_at: row.started_at,
      ended_at: row.ended_at,
      events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events,
      summary: typeof row.summary === 'string' ? JSON.parse(row.summary) : row.summary,
    }));
  } catch (error) {
    console.error('[HARNESS_DB] Error getting user traces:', error);
    throw error;
  }
}

export async function getAllTraces(limit: number = 100): Promise<HarnessTrace[]> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      `SELECT * FROM harness_traces ORDER BY started_at DESC LIMIT $1`,
      [limit]
    );
    
    return (result.rows as HarnessTraceRow[]).map((row) => ({
      trace_id: row.trace_id,
      session_id: row.session_id,
      user_id: row.user_id,
      started_at: row.started_at,
      ended_at: row.ended_at,
      events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events,
      summary: typeof row.summary === 'string' ? JSON.parse(row.summary) : row.summary,
    }));
  } catch (error) {
    console.error('[HARNESS_DB] Error getting all traces:', error);
    throw error;
  }
}
