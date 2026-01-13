import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserTraces } from '@/lib/harness/retrieval';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function GET(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Harness User API] Running in dev mode with mock authentication');
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
    const requestedUserId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const targetUserId = requestedUserId || userId;

    if (targetUserId !== userId && !isDevMode()) {
      return NextResponse.json(
        { error: 'Forbidden - you can only access your own traces' },
        { status: 403 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    const traces = await getUserTraces(targetUserId, limit);

    return NextResponse.json({
      traces,
      count: traces.length,
    });
  } catch (error) {
    console.error('[Harness User API] Error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch user traces' },
      { status: 500 }
    );
  }
}
