import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSeed, updateSeed, deleteSeed } from '@/lib/pglite/seeds';
import type { SeedUpdate, SeedStatus, SeedType } from '@/lib/seeds/types';

export const runtime = 'nodejs';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Seeds API] Running in dev mode with mock authentication');
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

    const seed = await getSeed(params.id);

    if (!seed) {
      return NextResponse.json(
        { error: 'Seed not found' },
        { status: 404 }
      );
    }

    if (seed.user_id !== userId && !isDevMode()) {
      return NextResponse.json(
        { error: 'Forbidden - you do not have access to this seed' },
        { status: 403 }
      );
    }

    return NextResponse.json(seed);
  } catch (error) {
    console.error('[Seeds API] Error fetching seed:', error);

    return NextResponse.json(
      { error: 'Failed to fetch seed' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Seeds API] Running in dev mode with mock authentication');
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

    const seed = await getSeed(params.id);

    if (!seed) {
      return NextResponse.json(
        { error: 'Seed not found' },
        { status: 404 }
      );
    }

    if (seed.user_id !== userId && !isDevMode()) {
      return NextResponse.json(
        { error: 'Forbidden - you do not have access to this seed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    if (body.type) {
      const validTypes: SeedType[] = ['principle', 'pattern', 'question', 'route', 'artifact', 'constraint'];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }
    
    if (body.status) {
      const validStatuses: SeedStatus[] = ['new', 'growing', 'mature', 'compost'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }
    
    const updates: SeedUpdate = {};
    
    if (body.name !== undefined) updates.name = body.name;
    if (body.type !== undefined) updates.type = body.type;
    if (body.status !== undefined) updates.status = body.status;
    if (body.content !== undefined) updates.content = body.content;
    if (body.why_matters !== undefined) updates.why_matters = body.why_matters;
    if (body.revisit_when !== undefined) updates.revisit_when = body.revisit_when;
    if (body.session_id !== undefined) updates.session_id = body.session_id;
    if (body.replanted !== undefined) updates.replanted = body.replanted;
    if (body.replant_count !== undefined) updates.replant_count = body.replant_count;

    const updatedSeed = await updateSeed(params.id, updates);

    if (!updatedSeed) {
      return NextResponse.json(
        { error: 'Failed to update seed' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSeed);
  } catch (error) {
    console.error('[Seeds API] Error updating seed:', error);

    return NextResponse.json(
      { error: 'Failed to update seed' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Seeds API] Running in dev mode with mock authentication');
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

    const seed = await getSeed(params.id);

    if (!seed) {
      return NextResponse.json(
        { error: 'Seed not found' },
        { status: 404 }
      );
    }

    if (seed.user_id !== userId && !isDevMode()) {
      return NextResponse.json(
        { error: 'Forbidden - you do not have access to this seed' },
        { status: 403 }
      );
    }

    const deleted = await deleteSeed(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete seed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Seeds API] Error deleting seed:', error);

    return NextResponse.json(
      { error: 'Failed to delete seed' },
      { status: 500 }
    );
  }
}
