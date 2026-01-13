import { getDB } from '../pglite/client';
import { GPT_4O_MINI_PRICING, DEFAULT_ROUTING_MODEL } from '../openai/types';
import type { TokenUsage } from '../openai/types';

export interface RoutingCost {
  routing_decision_id: string;
  session_id: string;
  tokens_used: number;
  cost_usd: number;
  model: string;
}

export interface CostBreakdown {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_cost_usd: number;
  output_cost_usd: number;
  total_cost_usd: number;
}

/**
 * Calculate cost from token usage using GPT-4o-mini pricing
 * 
 * @param usage - Token usage from OpenAI API response
 * @returns Cost breakdown with detailed token and cost information
 */
export function calculateRoutingCost(usage: TokenUsage): CostBreakdown {
  const inputCost = usage.prompt_tokens * GPT_4O_MINI_PRICING.input;
  const outputCost = usage.completion_tokens * GPT_4O_MINI_PRICING.output;
  const totalCost = inputCost + outputCost;

  return {
    input_tokens: usage.prompt_tokens,
    output_tokens: usage.completion_tokens,
    total_tokens: usage.total_tokens,
    input_cost_usd: inputCost,
    output_cost_usd: outputCost,
    total_cost_usd: totalCost,
  };
}

/**
 * Calculate cost from total tokens only (when breakdown unavailable)
 * Uses weighted average based on typical input/output ratio
 * 
 * @param totalTokens - Total tokens used
 * @returns Estimated cost in USD
 */
export function calculateCostFromTotal(totalTokens: number): number {
  // Assume 70% input, 30% output (typical for routing queries)
  const estimatedInputTokens = totalTokens * 0.7;
  const estimatedOutputTokens = totalTokens * 0.3;
  
  const inputCost = estimatedInputTokens * GPT_4O_MINI_PRICING.input;
  const outputCost = estimatedOutputTokens * GPT_4O_MINI_PRICING.output;
  
  return inputCost + outputCost;
}

/**
 * Track routing cost in the database
 * 
 * @param routingDecisionId - Foreign key to routing_decisions table
 * @param sessionId - Session identifier
 * @param usage - Token usage from OpenAI API response
 * @param model - Model used for routing (defaults to gpt-4o-mini)
 * @returns ID of the inserted routing_cost record
 */
export async function trackRoutingCost(
  routingDecisionId: string,
  sessionId: string,
  usage: TokenUsage,
  model: string = DEFAULT_ROUTING_MODEL
): Promise<string> {
  const db = await getDB();
  const costBreakdown = calculateRoutingCost(usage);

  const result = await db.query<{ id: string }>(
    `
    INSERT INTO routing_costs (
      routing_decision_id,
      session_id,
      tokens_used,
      cost_usd,
      model
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [
      routingDecisionId,
      sessionId,
      costBreakdown.total_tokens,
      costBreakdown.total_cost_usd,
      model,
    ]
  );

  return result.rows[0].id;
}

/**
 * Track routing cost using total tokens only
 * Use when detailed token breakdown is unavailable
 * 
 * @param routingDecisionId - Foreign key to routing_decisions table
 * @param sessionId - Session identifier
 * @param totalTokens - Total tokens used
 * @param model - Model used for routing (defaults to gpt-4o-mini)
 * @returns ID of the inserted routing_cost record
 */
export async function trackRoutingCostSimple(
  routingDecisionId: string,
  sessionId: string,
  totalTokens: number,
  model: string = DEFAULT_ROUTING_MODEL
): Promise<string> {
  const db = await getDB();
  const costUsd = calculateCostFromTotal(totalTokens);

  const result = await db.query<{ id: string }>(
    `
    INSERT INTO routing_costs (
      routing_decision_id,
      session_id,
      tokens_used,
      cost_usd,
      model
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [routingDecisionId, sessionId, totalTokens, costUsd, model]
  );

  return result.rows[0].id;
}

/**
 * Get total routing costs for a session
 * 
 * @param sessionId - Session identifier
 * @returns Object with total tokens, cost, and count of routing decisions
 */
export async function getSessionRoutingCosts(sessionId: string): Promise<{
  total_tokens: number;
  total_cost_usd: number;
  routing_count: number;
}> {
  const db = await getDB();

  const result = await db.query<{
    total_tokens: number;
    total_cost_usd: number;
    routing_count: number;
  }>(
    `
    SELECT 
      COALESCE(SUM(tokens_used), 0) as total_tokens,
      COALESCE(SUM(cost_usd), 0) as total_cost_usd,
      COUNT(*) as routing_count
    FROM routing_costs
    WHERE session_id = $1
    `,
    [sessionId]
  );

  return result.rows[0] || { total_tokens: 0, total_cost_usd: 0, routing_count: 0 };
}

/**
 * Get routing cost for a specific routing decision
 * 
 * @param routingDecisionId - Foreign key to routing_decisions table
 * @returns Routing cost record or null if not found
 */
export async function getRoutingCost(
  routingDecisionId: string
): Promise<RoutingCost | null> {
  const db = await getDB();

  const result = await db.query<RoutingCost>(
    `
    SELECT 
      routing_decision_id,
      session_id,
      tokens_used,
      cost_usd,
      model
    FROM routing_costs
    WHERE routing_decision_id = $1
    LIMIT 1
    `,
    [routingDecisionId]
  );

  return result.rows[0] || null;
}

/**
 * Get all routing costs for a session with timestamps
 * 
 * @param sessionId - Session identifier
 * @returns Array of routing cost records with timestamps
 */
export async function getSessionRoutingHistory(sessionId: string): Promise<
  Array<
    RoutingCost & {
      created_at: string;
      agent_selected: string;
      confidence: number;
    }
  >
> {
  const db = await getDB();

  const result = await db.query<
    RoutingCost & {
      created_at: string;
      agent_selected: string;
      confidence: number;
    }
  >(
    `
    SELECT 
      rc.routing_decision_id,
      rc.session_id,
      rc.tokens_used,
      rc.cost_usd,
      rc.model,
      rc.created_at,
      rd.agent_selected,
      rd.confidence
    FROM routing_costs rc
    JOIN routing_decisions rd ON rc.routing_decision_id = rd.id
    WHERE rc.session_id = $1
    ORDER BY rc.created_at DESC
    `,
    [sessionId]
  );

  return result.rows;
}
