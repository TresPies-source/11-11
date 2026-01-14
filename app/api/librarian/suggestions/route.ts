/**
 * API endpoint for proactive suggestions.
 * 
 * GET /api/librarian/suggestions
 * 
 * Query parameters:
 * - prompt_id (optional): Generate suggestions for a specific prompt
 * - trigger (optional): Trigger type (manual, prompt_save, dojo_session, page_load)
 * - limit (optional): Maximum number of suggestions (default: 8)
 * - include_types (optional): Comma-separated list of types to include
 * 
 * @module app/api/librarian/suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateSuggestions } from '@/lib/librarian/suggestions';
import type { SuggestionType } from '@/lib/librarian/suggestions';
import { z } from 'zod';

const SuggestionsQuerySchema = z.object({
  prompt_id: z.string().optional(),
  trigger: z.enum(['manual', 'prompt_save', 'dojo_session', 'page_load']).optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
  include_types: z.string().optional(),
});

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function GET(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Librarian Suggestions API] Running in dev mode with mock authentication');
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
      prompt_id: searchParams.get('prompt_id') || undefined,
      trigger: searchParams.get('trigger') || undefined,
      limit: searchParams.get('limit') || undefined,
      include_types: searchParams.get('include_types') || undefined,
    };

    const validation = SuggestionsQuerySchema.safeParse(rawParams);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { prompt_id, trigger, limit, include_types } = validation.data;

    const includeTypesArray: SuggestionType[] | undefined = include_types
      ? (include_types.split(',') as SuggestionType[])
      : undefined;

    const result = await generateSuggestions(userId, {
      promptId: prompt_id,
      trigger: trigger || 'manual',
      limit: limit || 8,
      includeTypes: includeTypesArray,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('❌ Suggestions API error:', error);

    if (error instanceof Error) {
      // Handle PGlite initialization errors gracefully (expected on server-side)
      if (error.message.includes('PGlite initialization failed') || error.message.includes('path') || error.message.includes('URL')) {
        console.warn('[Suggestions API] PGlite not available on server-side, returning empty suggestions');
        return NextResponse.json({ suggestions: [] }, { status: 200 });
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'OpenAI API rate limit exceeded. Please try again later.',
          },
          { status: 429 }
        );
      }

      if (error.message.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'Request timeout',
            message: 'The request took too long to complete. Please try again.',
          },
          { status: 504 }
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
