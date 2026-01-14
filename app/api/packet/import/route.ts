import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DojoPacketSchema } from '@/lib/packet/schema';
import {
  insertSession,
  insertSessionPerspective,
  insertSessionAssumption,
  insertSessionDecision,
} from '@/lib/pglite/sessions';
import type {
  SessionInsert,
  SessionPerspectiveInsert,
  SessionAssumptionInsert,
  SessionDecisionInsert,
} from '@/lib/pglite/types';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function POST(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Packet Import API] Running in dev mode with mock authentication');
      userId = 'dev@11-11.dev';
    } else {
      const session = await auth();
      if (!session || !session.user?.email) {
        return NextResponse.json(
          { error: 'Unauthorized - no valid session' },
          { status: 401 }
        );
      }
      userId = session.user.email;
    }

    const body = await request.json();

    const validationResult = DojoPacketSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid DojoPacket format',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const packet = validationResult.data;

    const sessionInsert: SessionInsert = {
      user_id: userId,
      title: packet.session.title,
      mode: packet.session.mode,
      situation: packet.situation,
      stake: packet.stake,
      agent_path: packet.session.agent_path,
      next_move_action: packet.next_move.action,
      next_move_why: packet.next_move.why,
      next_move_test: packet.next_move.smallest_test,
      artifacts: packet.artifacts,
      total_tokens: packet.trace_summary.tokens_total,
      total_cost_usd: packet.trace_summary.cost_total,
    };

    const newSession = await insertSession(sessionInsert);

    for (const perspective of packet.perspectives) {
      const perspectiveInsert: SessionPerspectiveInsert = {
        session_id: newSession.id,
        text: perspective.text,
        source: perspective.source,
      };
      await insertSessionPerspective(perspectiveInsert);
    }

    for (const assumption of packet.assumptions) {
      const assumptionInsert: SessionAssumptionInsert = {
        session_id: newSession.id,
        text: assumption.text,
        challenged: assumption.challenged,
      };
      await insertSessionAssumption(assumptionInsert);
    }

    for (const decision of packet.decisions) {
      const decisionInsert: SessionDecisionInsert = {
        session_id: newSession.id,
        text: decision.text,
        rationale: decision.rationale,
      };
      await insertSessionDecision(decisionInsert);
    }

    return NextResponse.json(
      {
        success: true,
        sessionId: newSession.id,
        message: 'DojoPacket imported successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Packet Import API] Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return NextResponse.json(
          { error: 'Session with this ID already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to import packet' },
      { status: 500 }
    );
  }
}
