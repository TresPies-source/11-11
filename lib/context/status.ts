import type { ContextStatus, TierBreakdown, ContextResult, ContextSnapshot } from './types';
import { getDB } from '../pglite/client';

export async function getContextStatus(
  sessionId: string,
  userId: string
): Promise<ContextStatus | null> {
  try {
    const db = await getDB();
    
    const result = await db.query<ContextSnapshot>(
      `SELECT * FROM context_snapshots 
       WHERE session_id = $1 AND user_id = $2 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [sessionId, userId]
    );
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    const snapshot = result.rows[0];
    
    const budgetPercent = typeof snapshot.budget_percent === 'string' 
      ? parseFloat(snapshot.budget_percent) 
      : snapshot.budget_percent;
    const totalTokens = typeof snapshot.total_tokens === 'string'
      ? parseInt(snapshot.total_tokens, 10)
      : snapshot.total_tokens;
    
    return {
      sessionId: snapshot.session_id,
      currentContext: {
        messages: [],
        tiers: [],
        totalTokens,
        tierBreakdown: {
          tier1: snapshot.tier_breakdown.tier1.tokens,
          tier2: snapshot.tier_breakdown.tier2.tokens,
          tier3: snapshot.tier_breakdown.tier3.tokens,
          tier4: snapshot.tier_breakdown.tier4.tokens,
        },
        pruningStrategy: snapshot.pruning_strategy,
        budgetPercent,
      },
      tierBreakdown: snapshot.tier_breakdown,
      budgetPercent,
      lastUpdated: snapshot.created_at,
    };
  } catch (error) {
    console.error('[CONTEXT STATUS] Failed to get context status:', error);
    return null;
  }
}

export function calculateTierBreakdown(contextResult: ContextResult): TierBreakdown {
  const breakdown: TierBreakdown = {
    tier1: { tokens: 0, items: 0 },
    tier2: { tokens: 0, items: 0 },
    tier3: { tokens: 0, items: 0 },
    tier4: { tokens: 0, items: 0 },
    total: 0,
  };
  
  for (const tier of contextResult.tiers) {
    const tierNum = tier.tier;
    breakdown[tierNum] = {
      tokens: tier.tokenCount,
      items: tier.content ? 1 : 0,
    };
  }
  
  breakdown.total = contextResult.totalTokens;
  
  return breakdown;
}

export async function saveContextSnapshot(
  sessionId: string,
  userId: string,
  contextResult: ContextResult
): Promise<void> {
  try {
    const db = await getDB();
    const tierBreakdown = calculateTierBreakdown(contextResult);
    
    await db.query(
      `INSERT INTO context_snapshots 
       (session_id, user_id, tier_breakdown, total_tokens, budget_percent, pruning_strategy)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        sessionId,
        userId,
        JSON.stringify(tierBreakdown),
        contextResult.totalTokens,
        contextResult.budgetPercent,
        JSON.stringify(contextResult.pruningStrategy),
      ]
    );
  } catch (error) {
    console.error('[CONTEXT STATUS] Failed to save context snapshot:', error);
  }
}

export async function getRecentSnapshots(
  userId: string,
  limit: number = 10
): Promise<ContextSnapshot[]> {
  try {
    const db = await getDB();
    
    const result = await db.query<ContextSnapshot>(
      `SELECT * FROM context_snapshots 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    
    return result.rows || [];
  } catch (error) {
    console.error('[CONTEXT STATUS] Failed to get recent snapshots:', error);
    return [];
  }
}

export async function getSessionSnapshots(
  sessionId: string
): Promise<ContextSnapshot[]> {
  try {
    const db = await getDB();
    
    const result = await db.query<ContextSnapshot>(
      `SELECT * FROM context_snapshots 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
      [sessionId]
    );
    
    return result.rows || [];
  } catch (error) {
    console.error('[CONTEXT STATUS] Failed to get session snapshots:', error);
    return [];
  }
}
