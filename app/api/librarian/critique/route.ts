import { NextRequest, NextResponse } from 'next/server';
import { critiquePromptSync } from '@/lib/critique/engine';
import { saveCritique } from '@/lib/supabase/critiques';
import type { CritiqueResult } from '@/lib/types';

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promptId, content } = body;

    if (!promptId || typeof promptId !== 'string') {
      return NextResponse.json(
        { error: 'promptId is required and must be a string' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required and must be a string' },
        { status: 400 }
      );
    }

    if (content.length === 0) {
      return NextResponse.json(
        { error: 'content cannot be empty' },
        { status: 400 }
      );
    }

    if (isDevMode) {
      console.log(`[Critique API] Dev mode - critiquing prompt ${promptId}`);
    }

    const critiqueResult = critiquePromptSync(content);

    const critiqueData: Omit<CritiqueResult, 'id' | 'promptId' | 'createdAt'> = {
      score: critiqueResult.score,
      concisenessScore: critiqueResult.concisenessScore,
      specificityScore: critiqueResult.specificityScore,
      contextScore: critiqueResult.contextScore,
      taskDecompositionScore: critiqueResult.taskDecompositionScore,
      feedback: critiqueResult.feedback,
    };

    const savedCritique = await saveCritique(promptId, critiqueData);

    if (!savedCritique && !isDevMode) {
      console.error('[Critique API] Failed to save critique to Supabase');
      return NextResponse.json(
        { error: 'Failed to save critique' },
        { status: 500 }
      );
    }

    const critique: CritiqueResult = savedCritique || {
      id: `temp-${promptId}`,
      promptId,
      ...critiqueData,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ critique });
  } catch (error) {
    console.error('[Critique API] Error processing critique:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate critique' },
      { status: 500 }
    );
  }
}
