import { getDB } from '../pglite/client';

/**
 * Aggregated usage statistics for an agent
 */
export interface AgentUsageStats {
  /** Total number of routing decisions for this agent */
  query_count: number;
  /** Total cost in USD across all queries */
  total_cost_usd: number;
  /** Average tokens used per query */
  avg_tokens_used: number;
  /** ISO timestamp of last usage, or null if never used */
  last_used_at: string | null;
}

/**
 * Retrieves usage statistics for a specific agent
 * 
 * Queries the `routing_decisions` and `routing_costs` tables to aggregate:
 * - Total query count
 * - Total cost in USD
 * - Average tokens used
 * - Last usage timestamp
 * 
 * @param agentId - Unique identifier of the agent (e.g., 'dojo', 'librarian')
 * @returns Usage statistics object, or null if agent has no usage history
 * 
 * @example
 * ```ts
 * const stats = await getAgentUsageStats('dojo');
 * if (stats) {
 *   console.log(`Dojo has handled ${stats.query_count} queries`);
 * }
 * ```
 */
export async function getAgentUsageStats(
  agentId: string
): Promise<AgentUsageStats | null> {
  try {
    const db = await getDB();

    const statsResult = await db.query<{
      query_count: number;
      total_cost_usd: number;
      avg_tokens_used: number;
      last_used_at: string | null;
    }>(
      `
      SELECT 
        COUNT(DISTINCT rd.id) as query_count,
        COALESCE(SUM(rc.cost_usd), 0) as total_cost_usd,
        COALESCE(AVG(rc.tokens_used), 0) as avg_tokens_used,
        MAX(rd.created_at) as last_used_at
      FROM routing_decisions rd
      LEFT JOIN routing_costs rc ON rc.routing_decision_id = rd.id
      WHERE rd.agent_selected = $1
      `,
      [agentId]
    );

    const stats = statsResult.rows[0];

    if (!stats || stats.query_count === 0) {
      return null;
    }

    return {
      query_count: Number(stats.query_count),
      total_cost_usd: Number(stats.total_cost_usd),
      avg_tokens_used: Math.round(Number(stats.avg_tokens_used)),
      last_used_at: stats.last_used_at,
    };
  } catch (error) {
    console.warn(`[Usage Stats] Failed to fetch stats for agent ${agentId}:`, error);
    return null;
  }
}

/**
 * Retrieves usage statistics for all agents
 * 
 * Returns a map of agent IDs to their usage statistics, aggregated from
 * the `routing_decisions` and `routing_costs` tables.
 * 
 * @returns Map of agent IDs to usage statistics, or empty object if no data
 * 
 * @example
 * ```ts
 * const allStats = await getAllAgentsUsageStats();
 * Object.entries(allStats).forEach(([agentId, stats]) => {
 *   console.log(`${agentId}: ${stats.query_count} queries`);
 * });
 * ```
 */
export async function getAllAgentsUsageStats(): Promise<
  Record<string, AgentUsageStats>
> {
  try {
    const db = await getDB();

    const statsResult = await db.query<{
      agent_id: string;
      query_count: number;
      total_cost_usd: number;
      avg_tokens_used: number;
      last_used_at: string | null;
    }>(
      `
      SELECT 
        rd.agent_selected as agent_id,
        COUNT(DISTINCT rd.id) as query_count,
        COALESCE(SUM(rc.cost_usd), 0) as total_cost_usd,
        COALESCE(AVG(rc.tokens_used), 0) as avg_tokens_used,
        MAX(rd.created_at) as last_used_at
      FROM routing_decisions rd
      LEFT JOIN routing_costs rc ON rc.routing_decision_id = rd.id
      GROUP BY rd.agent_selected
      `
    );

    const statsMap: Record<string, AgentUsageStats> = {};

    for (const row of statsResult.rows) {
      statsMap[row.agent_id] = {
        query_count: Number(row.query_count),
        total_cost_usd: Number(row.total_cost_usd),
        avg_tokens_used: Math.round(Number(row.avg_tokens_used)),
        last_used_at: row.last_used_at,
      };
    }

    return statsMap;
  } catch (error) {
    console.warn('[Usage Stats] Failed to fetch all agents stats:', error);
    return {};
  }
}
