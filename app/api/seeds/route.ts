import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSeeds, insertSeed } from '@/lib/pglite/seeds';
import type { SeedFilters, SeedInsert, SeedStatus, SeedType } from '@/lib/seeds/types';

export const runtime = 'nodejs';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    
    const filters: SeedFilters = {};
    
    const statusParam = searchParams.get('status');
    if (statusParam) {
      filters.status = statusParam.split(',') as SeedStatus[];
    }
    
    const typeParam = searchParams.get('type');
    if (typeParam) {
      filters.type = typeParam.split(',') as SeedType[];
    }
    
    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }
    
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }
    
    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = dateTo;
    }
    
    if (!isDevMode()) {
      filters.user_id = userId;
    }

    const seeds = await getSeeds(filters);

    return NextResponse.json({
      seeds,
      count: seeds.length,
    });
  } catch (error) {
    console.error('[Seeds API] Error fetching seeds:', error);

    return NextResponse.json(
      { error: 'Failed to fetch seeds' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    
    if (!body.name || !body.type || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, content' },
        { status: 400 }
      );
    }
    
    const validTypes: SeedType[] = ['principle', 'pattern', 'question', 'route', 'artifact', 'constraint'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    const validStatuses: SeedStatus[] = ['new', 'growing', 'mature', 'compost'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }
    
    const seedData: SeedInsert = {
      name: body.name,
      type: body.type,
      content: body.content,
      status: body.status,
      why_matters: body.why_matters,
      revisit_when: body.revisit_when,
      user_id: userId,
      session_id: body.session_id,
    };

    const newSeed = await insertSeed(seedData);

    return NextResponse.json(newSeed, { status: 201 });
  } catch (error) {
    console.error('[Seeds API] Error creating seed:', error);

    return NextResponse.json(
      { error: 'Failed to create seed' },
      { status: 500 }
    );
  }
}
