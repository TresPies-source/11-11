import { NextRequest, NextResponse } from 'next/server';
import { routeWithFallback } from '@/lib/agents/fallback';
import { getAgentById, getAvailableAgents } from '@/lib/agents/supervisor';
import { isDevMode } from '@/lib/openai/client';
import { HarnessEvent } from '@/lib/harness/types';

let spanCounter = 0;

function generateSpanId(): string {
  spanCounter++;
  return `span_${String(spanCounter).padStart(6, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, conversation_context, session_id, stream } = body;

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

    // Detect streaming mode: explicit stream field or Accept header
    const acceptHeader = request.headers.get('Accept') || '';
    const isStreamingMode = stream === true || acceptHeader.includes('text/event-stream');

    if (isDevMode()) {
      console.log('[Supervisor API] Dev mode - routing query:', query.substring(0, 50));
      console.log('[Supervisor API] Streaming mode:', isStreamingMode);
    }

    // If streaming mode, return a ReadableStream
    if (isStreamingMode) {
      const encoder = new TextEncoder();
      const startTime = Date.now();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // Emit SESSION_START event
            const sessionStartEvent: HarnessEvent = {
              span_id: generateSpanId(),
              parent_id: null,
              event_type: 'SESSION_START',
              timestamp: new Date().toISOString(),
              inputs: {
                query,
                session_id,
              },
              outputs: {},
              metadata: {
                cost_usd: 0,
              },
            };
            controller.enqueue(encoder.encode(JSON.stringify(sessionStartEvent) + '\n'));

            // Call the routing logic
            const result = await routeWithFallback({
              query,
              conversation_context: conversationContext,
              session_id,
              available_agents: getAvailableAgents(),
            });

            const agent = getAgentById(result.agent_id);
            if (!agent) {
              // Emit ERROR event
              const errorEvent: HarnessEvent = {
                span_id: generateSpanId(),
                parent_id: null,
                event_type: 'ERROR',
                timestamp: new Date().toISOString(),
                inputs: { query },
                outputs: {},
                metadata: {
                  error_message: `Agent not found: ${result.agent_id}`,
                  cost_usd: 0,
                },
              };
              controller.enqueue(encoder.encode(JSON.stringify(errorEvent) + '\n'));
              controller.close();
              return;
            }

            // Calculate routing cost
            const routingCost = result.usage
              ? result.usage.total_tokens * 0.00000025
              : 0;

            // Emit AGENT_ROUTING event
            const routingEvent: HarnessEvent = {
              span_id: generateSpanId(),
              parent_id: null,
              event_type: 'AGENT_ROUTING',
              timestamp: new Date().toISOString(),
              inputs: {
                query,
                available_agents: getAvailableAgents().map(a => a.id),
              },
              outputs: {
                agent_id: result.agent_id,
                agent_name: agent.name,
                confidence: result.confidence,
                reasoning: result.reasoning,
                fallback: result.fallback || false,
              },
              metadata: {
                cost_usd: routingCost,
                token_count: result.usage?.total_tokens || 0,
                confidence: result.confidence,
                duration_ms: Date.now() - startTime,
              },
            };
            controller.enqueue(encoder.encode(JSON.stringify(routingEvent) + '\n'));

            // Emit SESSION_END event
            const sessionEndEvent: HarnessEvent = {
              span_id: generateSpanId(),
              parent_id: null,
              event_type: 'SESSION_END',
              timestamp: new Date().toISOString(),
              inputs: {},
              outputs: {
                agent_id: result.agent_id,
                success: true,
              },
              metadata: {
                cost_usd: routingCost,
                duration_ms: Date.now() - startTime,
              },
            };
            controller.enqueue(encoder.encode(JSON.stringify(sessionEndEvent) + '\n'));

            controller.close();
          } catch (error) {
            // Emit ERROR event on failure
            const errorEvent: HarnessEvent = {
              span_id: generateSpanId(),
              parent_id: null,
              event_type: 'ERROR',
              timestamp: new Date().toISOString(),
              inputs: { query },
              outputs: {},
              metadata: {
                error_message: error instanceof Error ? error.message : 'Failed to route query',
                cost_usd: 0,
                duration_ms: Date.now() - startTime,
              },
            };
            controller.enqueue(encoder.encode(JSON.stringify(errorEvent) + '\n'));
            controller.close();
          }
        },
      });

      return new NextResponse(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming mode: existing JSON response (backward compatible)
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
        : {
            tokens_used: 0,
            cost_usd: 0,
          },
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
