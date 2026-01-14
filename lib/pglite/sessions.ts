import { getDB } from './client';
import type {
  SessionRow,
  SessionInsert,
  SessionPerspectiveRow,
  SessionPerspectiveInsert,
  SessionAssumptionRow,
  SessionAssumptionInsert,
  SessionDecisionRow,
  SessionDecisionInsert,
} from './types';

export async function getSession(sessionId: string): Promise<SessionRow | null> {
  const db = await getDB();
  const result = await db.query(
    `SELECT 
      id, user_id, title, mode, situation, stake, 
      agent_path, next_move_action, next_move_why, next_move_test,
      artifacts, total_tokens, total_cost_usd, created_at, updated_at
    FROM sessions 
    WHERE id = $1`,
    [sessionId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0] as any;
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    mode: row.mode,
    situation: row.situation,
    stake: row.stake,
    agent_path: row.agent_path || [],
    next_move_action: row.next_move_action,
    next_move_why: row.next_move_why,
    next_move_test: row.next_move_test,
    artifacts: row.artifacts || [],
    total_tokens: row.total_tokens,
    total_cost_usd: parseFloat(row.total_cost_usd || '0'),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function insertSession(session: SessionInsert): Promise<SessionRow> {
  const db = await getDB();
  const result = await db.query(
    `INSERT INTO sessions (
      user_id, title, mode, situation, stake, agent_path,
      next_move_action, next_move_why, next_move_test, artifacts,
      total_tokens, total_cost_usd
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING 
      id, user_id, title, mode, situation, stake, agent_path,
      next_move_action, next_move_why, next_move_test, artifacts,
      total_tokens, total_cost_usd, created_at, updated_at`,
    [
      session.user_id,
      session.title || null,
      session.mode || null,
      session.situation || null,
      session.stake || null,
      JSON.stringify(session.agent_path || []),
      session.next_move_action || null,
      session.next_move_why || null,
      session.next_move_test || null,
      JSON.stringify(session.artifacts || []),
      session.total_tokens || 0,
      session.total_cost_usd || 0,
    ]
  );

  const row = result.rows[0] as any;
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    mode: row.mode,
    situation: row.situation,
    stake: row.stake,
    agent_path: row.agent_path || [],
    next_move_action: row.next_move_action,
    next_move_why: row.next_move_why,
    next_move_test: row.next_move_test,
    artifacts: row.artifacts || [],
    total_tokens: row.total_tokens,
    total_cost_usd: parseFloat(row.total_cost_usd),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getSessionPerspectives(
  sessionId: string
): Promise<SessionPerspectiveRow[]> {
  const db = await getDB();
  const result = await db.query(
    'SELECT id, session_id, text, source, created_at FROM session_perspectives WHERE session_id = $1 ORDER BY created_at ASC',
    [sessionId]
  );
  return result.rows as SessionPerspectiveRow[];
}

export async function insertSessionPerspective(
  perspective: SessionPerspectiveInsert
): Promise<SessionPerspectiveRow> {
  const db = await getDB();
  const result = await db.query(
    `INSERT INTO session_perspectives (session_id, text, source)
    VALUES ($1, $2, $3)
    RETURNING id, session_id, text, source, created_at`,
    [perspective.session_id, perspective.text, perspective.source]
  );
  return result.rows[0] as SessionPerspectiveRow;
}

export async function getSessionAssumptions(
  sessionId: string
): Promise<SessionAssumptionRow[]> {
  const db = await getDB();
  const result = await db.query(
    'SELECT id, session_id, text, challenged, created_at FROM session_assumptions WHERE session_id = $1 ORDER BY created_at ASC',
    [sessionId]
  );
  return result.rows as SessionAssumptionRow[];
}

export async function insertSessionAssumption(
  assumption: SessionAssumptionInsert
): Promise<SessionAssumptionRow> {
  const db = await getDB();
  const result = await db.query(
    `INSERT INTO session_assumptions (session_id, text, challenged)
    VALUES ($1, $2, $3)
    RETURNING id, session_id, text, challenged, created_at`,
    [assumption.session_id, assumption.text, assumption.challenged || false]
  );
  return result.rows[0] as SessionAssumptionRow;
}

export async function getSessionDecisions(
  sessionId: string
): Promise<SessionDecisionRow[]> {
  const db = await getDB();
  const result = await db.query(
    'SELECT id, session_id, text, rationale, created_at FROM session_decisions WHERE session_id = $1 ORDER BY created_at ASC',
    [sessionId]
  );
  return result.rows as SessionDecisionRow[];
}

export async function insertSessionDecision(
  decision: SessionDecisionInsert
): Promise<SessionDecisionRow> {
  const db = await getDB();
  const result = await db.query(
    `INSERT INTO session_decisions (session_id, text, rationale)
    VALUES ($1, $2, $3)
    RETURNING id, session_id, text, rationale, created_at`,
    [decision.session_id, decision.text, decision.rationale]
  );
  return result.rows[0] as SessionDecisionRow;
}

export async function getAllSessions(userId: string): Promise<SessionRow[]> {
  const db = await getDB();
  const result = await db.query(
    `SELECT 
      id, user_id, title, mode, situation, stake, 
      agent_path, next_move_action, next_move_why, next_move_test,
      artifacts, total_tokens, total_cost_usd, created_at, updated_at
    FROM sessions 
    WHERE user_id = $1
    ORDER BY updated_at DESC`,
    [userId]
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    mode: row.mode,
    situation: row.situation,
    stake: row.stake,
    agent_path: row.agent_path || [],
    next_move_action: row.next_move_action,
    next_move_why: row.next_move_why,
    next_move_test: row.next_move_test,
    artifacts: row.artifacts || [],
    total_tokens: row.total_tokens,
    total_cost_usd: parseFloat(row.total_cost_usd || '0'),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}
