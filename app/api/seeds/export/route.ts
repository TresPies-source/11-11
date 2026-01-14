import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSeed } from '@/lib/pglite/seeds';
import type { SeedRow } from '@/lib/seeds/types';

export const runtime = 'nodejs';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

function generateMemoryPatch(seeds: SeedRow[]): string {
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });

  const header = `# Memory Patch: Replanted Seeds

_Generated on ${timestamp}_

---

`;

  const seedSections = seeds.map(seed => {
    return `## Seed: ${seed.name}

**Type:** ${seed.type}  
**Status:** ${seed.status}

**Why it matters:** ${seed.why_matters || 'N/A'}  
**Revisit when:** ${seed.revisit_when || 'N/A'}

**Content:**
${seed.content}

---
`;
  }).join('\n');

  const footer = `
**Total Seeds:** ${seeds.length}
`;

  return header + seedSections + footer;
}

export async function POST(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Seeds Export API] Running in dev mode with mock authentication');
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
    
    if (!body.seedIds || !Array.isArray(body.seedIds) || body.seedIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid seedIds - must be a non-empty array' },
        { status: 400 }
      );
    }

    const seeds: SeedRow[] = [];
    const notFound: string[] = [];

    for (const seedId of body.seedIds) {
      try {
        const seed = await getSeed(seedId);
        if (seed) {
          if (!isDevMode() && seed.user_id !== userId) {
            return NextResponse.json(
              { error: `Unauthorized - seed ${seedId} does not belong to current user` },
              { status: 403 }
            );
          }
          seeds.push(seed);
        } else {
          notFound.push(seedId);
        }
      } catch (error) {
        console.error(`[Seeds Export API] Error fetching seed ${seedId}:`, error);
        notFound.push(seedId);
      }
    }

    if (seeds.length === 0) {
      return NextResponse.json(
        { error: 'No valid seeds found to export', notFound },
        { status: 404 }
      );
    }

    const memoryPatch = generateMemoryPatch(seeds);

    const filename = `memory-patch-${new Date().toISOString().split('T')[0]}.md`;

    return new NextResponse(memoryPatch, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[Seeds Export API] Error exporting seeds:', error);

    return NextResponse.json(
      { error: 'Failed to export seeds' },
      { status: 500 }
    );
  }
}
