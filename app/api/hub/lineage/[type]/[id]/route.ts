import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getLineage } from '@/lib/pglite/knowledge-links';
import type { ArtifactType } from '@/lib/hub/types';

export const runtime = 'nodejs';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

const validArtifactTypes: ArtifactType[] = ['session', 'prompt', 'seed', 'file'];

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Hub Lineage API] Running in dev mode with mock authentication');
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

    const { type, id } = params;

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required parameters: type and id' },
        { status: 400 }
      );
    }

    if (!validArtifactTypes.includes(type as ArtifactType)) {
      return NextResponse.json(
        { error: `Invalid artifact type. Must be one of: ${validArtifactTypes.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`[Hub Lineage API] Fetching lineage for ${type}:${id}`);
    
    const lineageNodes = await getLineage(type as ArtifactType, id, userId);

    if (lineageNodes.length === 0) {
      console.log(`[Hub Lineage API] No lineage found for ${type}:${id}`);
    } else {
      console.log(`[Hub Lineage API] Found ${lineageNodes.length} lineage nodes for ${type}:${id}`);
    }

    return NextResponse.json({
      artifact: { type, id },
      lineage: lineageNodes,
      count: lineageNodes.length,
    }, { status: 200 });
  } catch (error) {
    console.error('[Hub Lineage API] Error fetching lineage:', error);

    return NextResponse.json(
      { error: 'Failed to fetch lineage', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
