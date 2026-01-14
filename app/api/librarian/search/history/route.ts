/**
 * API endpoint for search history.
 * 
 * GET /api/librarian/search/history
 * 
 * Query parameters:
 * - limit (optional): Maximum number of history entries to return (default: 5, max: 20)
 * 
 * @module app/api/librarian/search/history
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRecentSearches } from '@/lib/librarian/search';
import { z } from 'zod';

const HistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function GET(request: NextRequest) {
  let userId: string = 'dev-user'; // Default value for error handling
  
  try {
    if (isDevMode()) {
      console.warn('[Search History API] Running in dev mode with mock authentication');
      userId = 'dev-user';
    } else {
      const session = await auth();
      if (!session || !session.user?.email) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'No active session found' },
          { status: 401 }
        );
      }
      userId = session.user.email;
    }

    const { searchParams } = request.nextUrl;
    const rawParams = {
      limit: searchParams.get('limit') || undefined,
    };

    const validation = HistoryQuerySchema.safeParse(rawParams);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { limit = 5 } = validation.data;

    const history = await getRecentSearches(userId, limit);

    return NextResponse.json(
      {
        history,
        count: history.length,
        user_id: userId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Search history API error:', error);

    if (error instanceof Error) {
      // Handle PGlite initialization errors gracefully (expected on server-side)
      if (error.message.includes('PGlite initialization failed') || error.message.includes('path') || error.message.includes('URL')) {
        console.warn('[Search History API] PGlite not available on server-side, returning empty history');
        return NextResponse.json(
          {
            history: [],
            count: 0,
            user_id: userId,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
