import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { semanticSearch } from '@/lib/librarian/search';
import { z } from 'zod';
import type { PromptStatus } from '@/lib/pglite/types';

const searchRequestSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  filters: z.object({
    status: z.union([
      z.enum(['draft', 'active', 'archived']),
      z.array(z.enum(['draft', 'active', 'archived']))
    ]).optional(),
    tags: z.array(z.string()).optional(),
    threshold: z.number().min(0).max(1).optional(),
    limit: z.number().int().positive().max(100).optional(),
  }).optional().default({}),
});

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function POST(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Librarian Search API] Running in dev mode with mock authentication');
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

    const validationResult = searchRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { query, filters } = validationResult.data;

    const result = await semanticSearch(query, userId, filters);

    return NextResponse.json({
      results: result.results,
      query: result.query,
      count: result.count,
      filters: result.filters,
      duration_ms: result.duration_ms,
    });
  } catch (error) {
    console.error('[Librarian Search API] Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('OpenAI')) {
        return NextResponse.json(
          { error: 'Failed to generate search embedding', details: error.message },
          { status: 503 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to execute search' },
      { status: 500 }
    );
  }
}
