import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { embedPrompt } from '@/lib/librarian/embeddings';
import { z } from 'zod';

const embedRequestSchema = z.object({
  prompt_id: z.string().min(1, 'Prompt ID is required'),
  content: z.string().min(1, 'Content cannot be empty'),
  session_id: z.string().optional(),
});

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function POST(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Librarian Embed API] Running in dev mode with mock authentication');
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

    const validationResult = embedRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { prompt_id, content, session_id } = validationResult.data;

    const result = await embedPrompt(prompt_id, content, userId, session_id);

    return NextResponse.json({
      success: true,
      prompt_id,
      embedding_generated: true,
      tokens_used: result.tokens_used,
      cost_usd: result.cost_usd,
      model: result.model,
    });
  } catch (error) {
    console.error('[Librarian Embed API] Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('OpenAI')) {
        return NextResponse.json(
          { error: 'Failed to generate embedding', details: error.message },
          { status: 503 }
        );
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Prompt not found' },
          { status: 404 }
        );
      }

      if (error.message.includes('empty')) {
        return NextResponse.json(
          { error: 'Content cannot be empty' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}
