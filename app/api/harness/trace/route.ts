import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTrace } from '@/lib/harness/retrieval';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function GET(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Harness Trace API] Running in dev mode with mock authentication');
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
    const traceId = searchParams.get('trace_id');

    if (!traceId) {
      return NextResponse.json(
        { error: 'trace_id parameter is required' },
        { status: 400 }
      );
    }

    const trace = await getTrace(traceId);

    if (!trace) {
      return NextResponse.json(
        { error: 'Trace not found' },
        { status: 404 }
      );
    }

    if (trace.user_id !== userId && !isDevMode()) {
      return NextResponse.json(
        { error: 'Forbidden - you do not have access to this trace' },
        { status: 403 }
      );
    }

    return NextResponse.json(trace);
  } catch (error) {
    console.error('[Harness Trace API] Error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch trace' },
      { status: 500 }
    );
  }
}
