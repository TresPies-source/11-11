import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { insertSessionMessage, getSessionMessages } from '@/lib/pglite/session-messages';
import type { SessionMessageInsert } from '@/lib/dojo/types';

export const runtime = 'nodejs';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function GET(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Dojo Messages API] Running in dev mode with mock authentication');
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

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: sessionId' },
        { status: 400 }
      );
    }

    const messages = await getSessionMessages(sessionId);

    return NextResponse.json({
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error('[Dojo Messages API] Error fetching messages:', error);

    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Dojo Messages API] Running in dev mode with mock authentication');
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

    if (!body.session_id || !body.role || !body.content || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, role, content, timestamp' },
        { status: 400 }
      );
    }

    const validRoles = ['user', 'agent'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const messageData: SessionMessageInsert = {
      session_id: body.session_id,
      role: body.role,
      content: body.content,
      mode: body.mode,
      timestamp: body.timestamp,
      metadata: body.metadata || {},
    };

    const newMessage = await insertSessionMessage(messageData);

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('[Dojo Messages API] Error creating message:', error);

    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
