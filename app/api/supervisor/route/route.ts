import { NextRequest, NextResponse } from 'next/server';
import { routeWithFallback } from '@/lib/agents/fallback';
import { getAgentById, getAvailableAgents } from '@/lib/agents/supervisor';
import { isDevMode } from '@/lib/openai/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, conversation_context, session_id } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'query is required and must be a string' },
        { status: 400 }
      );
    }

    if (query.trim().length === 0) {
      return NextResponse.json(
        { error: 'query cannot be empty' },
        { status: 400 }
      );
    }

    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json(
        { error: 'session_id is required and must be a string' },
        { status: 400 }
      );
    }

    const conversationContext = Array.isArray(conversation_context)
      ? conversation_context
      : [];

    if (isDevMode()) {
      console.log('[Supervisor API] Dev mode - routing query:', query.substring(0, 50));
    }

    const result = await routeWithFallback({
      query,
      conversation_context: conversationContext,
      session_id,
      available_agents: getAvailableAgents(),
    });

    const agent = getAgentById(result.agent_id);
    if (!agent) {
      return NextResponse.json(
        { error: `Agent not found: ${result.agent_id}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      agent_id: result.agent_id,
      agent_name: agent.name,
      confidence: result.confidence,
      reasoning: result.reasoning,
      fallback: result.fallback || false,
      routing_cost: result.usage
        ? {
            tokens_used: result.usage.total_tokens,
            cost_usd: result.usage.total_tokens * 0.00000025,
          }
        : null,
    });
  } catch (error) {
    console.error('[Supervisor API] Error routing query:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to route query' },
      { status: 500 }
    );
  }
}
