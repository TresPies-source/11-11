import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSessionTraces } from '@/lib/harness/retrieval';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function GET(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Harness Session API] Running in dev mode with mock authentication');
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
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id parameter is required' },
        { status: 400 }
      );
    }

    const traces = await getSessionTraces(sessionId);

    if (traces.length > 0 && traces[0].user_id !== userId && !isDevMode()) {
      return NextResponse.json(
        { error: 'Forbidden - you do not have access to this session' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      traces,
      count: traces.length,
    });
  } catch (error) {
    console.error('[Harness Session API] Error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch session traces' },
      { status: 500 }
    );
  }
}
