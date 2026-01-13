import { getDB } from './client';
import type {
  CostRecordRow,
  CostRecordInsert,
  SessionRow,
  SessionInsert,
  UserMonthlyUsageRow,
  UserMonthlyUsageInsert,
} from './types';

export async function insertCostRecord(
  record: CostRecordInsert
): Promise<CostRecordRow> {
  const db = await getDB();

  const result = await db.query(
    `
    INSERT INTO cost_records (
      user_id, session_id, query_id, model,
      prompt_tokens, completion_tokens, total_tokens,
      cost_usd, operation_type
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `,
    [
      record.user_id,
      record.session_id || null,
      record.query_id || null,
      record.model,
      record.prompt_tokens,
      record.completion_tokens,
      record.total_tokens,
      record.cost_usd,
      record.operation_type,
    ]
  );

  return result.rows[0] as CostRecordRow;
}

export async function getSessionTokenUsage(sessionId: string): Promise<number> {
  const db = await getDB();

  const result = await db.query(
    'SELECT total_tokens FROM sessions WHERE id = $1',
    [sessionId]
  );

  if (result.rows.length === 0) {
    return 0;
  }

  return (result.rows[0] as SessionRow).total_tokens;
}

export async function getUserMonthlyTokenUsage(
  userId: string,
  month?: string
): Promise<number> {
  const db = await getDB();
  const targetMonth = month || getCurrentMonth();

  const result = await db.query(
    'SELECT total_tokens FROM user_monthly_usage WHERE user_id = $1 AND month = $2',
    [userId, targetMonth]
  );

  if (result.rows.length === 0) {
    return 0;
  }

  return (result.rows[0] as UserMonthlyUsageRow).total_tokens;
}

export async function createSession(
  insert: SessionInsert
): Promise<SessionRow> {
  const db = await getDB();

  const result = await db.query(
    `
    INSERT INTO sessions (user_id, total_tokens, total_cost_usd)
    VALUES ($1, $2, $3)
    RETURNING *
  `,
    [
      insert.user_id,
      insert.total_tokens || 0,
      insert.total_cost_usd || 0,
    ]
  );

  return result.rows[0] as SessionRow;
}

export async function updateSessionUsage(
  sessionId: string,
  tokensToAdd: number,
  costToAdd: number
): Promise<void> {
  const db = await getDB();

  await db.query(
    `
    UPDATE sessions
    SET 
      total_tokens = total_tokens + $1,
      total_cost_usd = total_cost_usd + $2,
      updated_at = NOW()
    WHERE id = $3
  `,
    [tokensToAdd, costToAdd, sessionId]
  );
}

export async function upsertUserMonthlyUsage(
  userId: string,
  month: string,
  tokensToAdd: number,
  costToAdd: number
): Promise<void> {
  const db = await getDB();

  await db.query(
    `
    INSERT INTO user_monthly_usage (user_id, month, total_tokens, total_cost_usd)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, month)
    DO UPDATE SET
      total_tokens = user_monthly_usage.total_tokens + $3,
      total_cost_usd = user_monthly_usage.total_cost_usd + $4,
      updated_at = NOW()
  `,
    [userId, month, tokensToAdd, costToAdd]
  );
}

export async function getCostRecords(
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<CostRecordRow[]> {
  const db = await getDB();

  const result = await db.query(
    `
    SELECT * FROM cost_records
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `,
    [userId, limit, offset]
  );

  return result.rows as CostRecordRow[];
}

export async function getCostRecordsBySession(
  sessionId: string
): Promise<CostRecordRow[]> {
  const db = await getDB();

  const result = await db.query(
    `
    SELECT * FROM cost_records
    WHERE session_id = $1
    ORDER BY created_at DESC
  `,
    [sessionId]
  );

  return result.rows as CostRecordRow[];
}

export async function getCostTrends(
  userId: string,
  days: number = 30
): Promise<Array<{ date: string; total_tokens: number; total_cost: number }>> {
  const db = await getDB();

  const result = await db.query(
    `
    SELECT 
      DATE(created_at) as date,
      SUM(total_tokens) as total_tokens,
      SUM(cost_usd) as total_cost
    FROM cost_records
    WHERE user_id = $1
      AND created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `,
    [userId]
  );

  return result.rows.map((row: any) => ({
    date: row.date,
    total_tokens: parseInt(row.total_tokens || '0', 10),
    total_cost: parseFloat(row.total_cost || '0'),
  }));
}

export async function getUserMonthlyCost(
  userId: string,
  month?: string
): Promise<number> {
  const db = await getDB();
  const targetMonth = month || getCurrentMonth();

  const result = await db.query(
    'SELECT total_cost_usd FROM user_monthly_usage WHERE user_id = $1 AND month = $2',
    [userId, targetMonth]
  );

  if (result.rows.length === 0) {
    return 0;
  }

  return parseFloat((result.rows[0] as UserMonthlyUsageRow).total_cost_usd.toString());
}

export async function getMonthlyTotalCost(
  userId: string,
  month?: string
): Promise<number> {
  return getUserMonthlyCost(userId, month);
}

export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
