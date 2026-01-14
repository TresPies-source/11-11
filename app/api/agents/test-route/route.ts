import { NextRequest, NextResponse } from 'next/server';
import { routeQuery, getAvailableAgents } from '@/lib/agents/supervisor';
import { calculateRoutingCost } from '@/lib/agents/cost-tracking';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

/**
 * POST /api/agents/test-route
 * 
 * Test endpoint for validating supervisor routing logic without saving to database.
 * 
 * Request Body:
 * - query: string - The test query to route
 * - conversation_context?: array - Optional conversation history
 * 
 * Response:
 * - agent_id: string - Selected agent identifier
 * - agent_name: string - Selected agent display name
 * - confidence: number - Routing confidence (0-1)
 * - reasoning: string - Explanation of routing decision
 * - fallback: boolean - Whether keyword fallback was used
 * - cost_breakdown: object | null - Token usage and cost, or null if keyword routing
 * 
 * Dev Mode:
 * - No authentication required when NEXT_PUBLIC_DEV_MODE=true
 * - Does not save routing decision to database
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/agents/test-route', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ query: 'Help me debug a conflict' })
 * });
 * const result = await response.json();
 * console.log(`Routed to: ${result.agent_name}`);
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.query || typeof body.query !== 'string' || body.query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (isDevMode()) {
      console.log('[Test Route API] Dev mode - testing query:', body.query);
    }

    const availableAgents = getAvailableAgents();
    const conversationContext = Array.isArray(body.conversation_context) 
      ? body.conversation_context 
      : [];

    const decision = await routeQuery({
      query: body.query,
      conversation_context: conversationContext,
      available_agents: availableAgents,
      session_id: 'test-session',
    });

    let costBreakdown = null;
    if (decision.usage) {
      costBreakdown = calculateRoutingCost(decision.usage);
    }

    return NextResponse.json({
      agent_id: decision.agent_id,
      agent_name: decision.agent_name,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      fallback: decision.fallback || false,
      cost_breakdown: costBreakdown ? {
        input_tokens: costBreakdown.input_tokens,
        output_tokens: costBreakdown.output_tokens,
        total_tokens: costBreakdown.total_tokens,
        total_cost_usd: costBreakdown.total_cost_usd,
      } : null,
    });
  } catch (error) {
    console.error('[Test Route API] Error testing route:', error);

    return NextResponse.json(
      { 
        error: 'Failed to test routing',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
