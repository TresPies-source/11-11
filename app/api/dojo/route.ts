import { NextRequest, NextResponse } from 'next/server';
import { handleDojoQuery, buildDojoPacketFromContext } from '@/lib/agents/dojo-handler';
import { HarnessEvent } from '@/lib/harness/types';
import type { ChatMessage } from '@/lib/agents/types';

let spanCounter = 0;

function generateSpanId(): string {
  spanCounter++;
  return `span_${String(spanCounter).padStart(6, '0')}`;
}

interface DojoRequestBody {
  situation: string;
  perspectives?: string[];
  sessionId: string;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const startTime = Date.now();

  try {
    const body = await request.json() as DojoRequestBody;
    const { situation, perspectives = [], sessionId } = body;

    if (!situation || typeof situation !== 'string' || situation.trim().length === 0) {
      return NextResponse.json(
        { error: 'situation is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'sessionId is required and must be a string' },
        { status: 400 }
      );
    }

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const sessionStartEvent: HarnessEvent = {
            span_id: generateSpanId(),
            parent_id: null,
            event_type: 'SESSION_START',
            timestamp: new Date().toISOString(),
            inputs: {
              situation,
              perspectives,
              sessionId,
            },
            outputs: {},
            metadata: {
              cost_usd: 0,
            },
          };
          controller.enqueue(encoder.encode(JSON.stringify(sessionStartEvent) + '\n'));

          const conversationHistory: ChatMessage[] = [
            {
              role: 'user',
              content: situation,
              timestamp: new Date().toISOString(),
            },
          ];

          const context = {
            session_id: sessionId,
            user_intent: situation,
            conversation_history: conversationHistory,
            available_context: [],
            budget: {
              max_cost_usd: 1.0,
              remaining_usd: 1.0,
            },
          };

          const packet = buildDojoPacketFromContext(context);

          if (perspectives.length > 0) {
            packet.perspectives = [
              ...packet.perspectives,
              ...perspectives.map(p => ({
                text: p,
                source: 'user' as const,
                timestamp: new Date().toISOString(),
              })),
            ];
          }

          const agentStartEvent: HarnessEvent = {
            span_id: generateSpanId(),
            parent_id: null,
            event_type: 'AGENT_ACTIVITY_START',
            timestamp: new Date().toISOString(),
            inputs: {
              agent_id: 'dojo',
              situation,
            },
            outputs: {},
            metadata: {
              cost_usd: 0,
            },
          };
          controller.enqueue(encoder.encode(JSON.stringify(agentStartEvent) + '\n'));

          const result = await handleDojoQuery({
            packet,
            conversation_history: conversationHistory,
          });

          const modeTransitionEvent: HarnessEvent = {
            span_id: generateSpanId(),
            parent_id: null,
            event_type: 'MODE_TRANSITION',
            timestamp: new Date().toISOString(),
            inputs: {
              agent_id: 'dojo',
            },
            outputs: {
              mode: result.updated_packet.session.mode,
            },
            metadata: {
              cost_usd: 0,
            },
          };
          controller.enqueue(encoder.encode(JSON.stringify(modeTransitionEvent) + '\n'));

          const responseEvent: HarnessEvent = {
            span_id: generateSpanId(),
            parent_id: null,
            event_type: 'AGENT_RESPONSE',
            timestamp: new Date().toISOString(),
            inputs: {},
            outputs: {
              content: result.summary,
            },
            metadata: {
              cost_usd: 0,
            },
          };
          controller.enqueue(encoder.encode(JSON.stringify(responseEvent) + '\n'));

          const agentCompleteEvent: HarnessEvent = {
            span_id: generateSpanId(),
            parent_id: null,
            event_type: 'AGENT_ACTIVITY_COMPLETE',
            timestamp: new Date().toISOString(),
            inputs: {},
            outputs: {
              agent_id: 'dojo',
              status: 'success',
            },
            metadata: {
              cost_usd: 0,
              duration_ms: Date.now() - startTime,
            },
          };
          controller.enqueue(encoder.encode(JSON.stringify(agentCompleteEvent) + '\n'));

          const sessionEndEvent: HarnessEvent = {
            span_id: generateSpanId(),
            parent_id: null,
            event_type: 'SESSION_END',
            timestamp: new Date().toISOString(),
            inputs: {},
            outputs: {
              success: true,
            },
            metadata: {
              cost_usd: 0,
              duration_ms: Date.now() - startTime,
            },
          };
          controller.enqueue(encoder.encode(JSON.stringify(sessionEndEvent) + '\n'));

          controller.close();
        } catch (error) {
          const errorEvent: HarnessEvent = {
            span_id: generateSpanId(),
            parent_id: null,
            event_type: 'ERROR',
            timestamp: new Date().toISOString(),
            inputs: { situation },
            outputs: {},
            metadata: {
              error_message: error instanceof Error ? error.message : 'Failed to process dojo query',
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
  } catch (error) {
    console.error('[Dojo API] Error processing request:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process dojo query' },
      { status: 500 }
    );
  }
}
