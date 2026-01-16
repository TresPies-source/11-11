import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPrompt } from '@/lib/pglite/prompts';
import { insertSeed } from '@/lib/pglite/seeds';
import { insertKnowledgeLink } from '@/lib/pglite/knowledge-links';
import type { TransferRequest, TransferResponse } from '@/lib/hub/types';
import type { PromptInsert, PromptVisibility } from '@/lib/pglite/types';
import type { SeedInsert } from '@/lib/seeds/types';

export const runtime = 'nodejs';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function POST(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Hub Transfer API] Running in dev mode with mock authentication');
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

    const body: TransferRequest = await request.json();

    if (!body.target?.type || !body.content?.content) {
      return NextResponse.json(
        { error: 'Missing required fields: target.type, content.content' },
        { status: 400 }
      );
    }

    const validTargetTypes = ['prompt', 'seed'];
    if (!validTargetTypes.includes(body.target.type)) {
      return NextResponse.json(
        { error: `Invalid target type. Must be one of: ${validTargetTypes.join(', ')}` },
        { status: 400 }
      );
    }

    let targetId: string;
    let linkId: string | undefined;

    if (body.target.type === 'prompt') {
      if (!body.content.title) {
        return NextResponse.json(
          { error: 'Missing required field for prompt: title' },
          { status: 400 }
        );
      }

      const validVisibilities: PromptVisibility[] = ['private', 'unlisted', 'public'];
      const visibility: PromptVisibility = 
        body.content.visibility && validVisibilities.includes(body.content.visibility as PromptVisibility)
          ? (body.content.visibility as PromptVisibility)
          : 'private';

      const promptData: PromptInsert = {
        user_id: userId,
        title: body.content.title,
        content: body.content.content,
        status: 'draft',
        visibility,
      };

      console.log(`[Hub Transfer API] Creating prompt: ${promptData.title}`);
      const newPrompt = await createPrompt(promptData);
      targetId = newPrompt.id;

      console.log(`[Hub Transfer API] Created prompt ${targetId}`);
    } else if (body.target.type === 'seed') {
      if (!body.content.title || !body.content.type) {
        return NextResponse.json(
          { error: 'Missing required fields for seed: title, type' },
          { status: 400 }
        );
      }

      const validSeedTypes = ['principle', 'pattern', 'question', 'route', 'artifact', 'constraint'];
      if (!validSeedTypes.includes(body.content.type)) {
        return NextResponse.json(
          { error: `Invalid seed type. Must be one of: ${validSeedTypes.join(', ')}` },
          { status: 400 }
        );
      }

      const validSeedStatuses = ['new', 'growing', 'mature', 'compost'];
      if (body.content.status && !validSeedStatuses.includes(body.content.status)) {
        return NextResponse.json(
          { error: `Invalid seed status. Must be one of: ${validSeedStatuses.join(', ')}` },
          { status: 400 }
        );
      }

      const seedData: SeedInsert = {
        name: body.content.title,
        type: body.content.type as any,
        content: body.content.content,
        status: (body.content.status as any) || 'new',
        why_matters: body.content.why_matters,
        revisit_when: body.content.revisit_when,
        user_id: userId,
      };

      console.log(`[Hub Transfer API] Creating seed: ${seedData.name}`);
      const newSeed = await insertSeed(seedData);
      targetId = newSeed.id;

      console.log(`[Hub Transfer API] Created seed ${targetId}`);
    } else {
      return NextResponse.json(
        { error: 'Unsupported target type' },
        { status: 400 }
      );
    }

    if (body.create_link && body.source) {
      const validSourceTypes = ['session', 'prompt', 'seed', 'file'];
      if (!validSourceTypes.includes(body.source.type)) {
        return NextResponse.json(
          { error: `Invalid source type. Must be one of: ${validSourceTypes.join(', ')}` },
          { status: 400 }
        );
      }

      if (!body.source.id) {
        return NextResponse.json(
          { error: 'Missing required field: source.id when create_link is true' },
          { status: 400 }
        );
      }

      console.log(`[Hub Transfer API] Creating knowledge link: ${body.source.type}:${body.source.id} -> ${body.target.type}:${targetId}`);
      
      const link = await insertKnowledgeLink({
        source_type: body.source.type,
        source_id: body.source.id,
        target_type: body.target.type,
        target_id: targetId,
        relationship: 'extracted_from',
        metadata: {
          transfer_timestamp: new Date().toISOString(),
          description: body.content.description,
          tags: body.content.tags,
        },
        user_id: userId,
      });

      linkId = link.id;
      console.log(`[Hub Transfer API] Created knowledge link ${linkId}`);
    }

    const response: TransferResponse = {
      success: true,
      target_id: targetId,
      link_id: linkId,
      message: `Successfully created ${body.target.type}`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[Hub Transfer API] Error during transfer:', error);

    return NextResponse.json(
      { error: 'Failed to transfer artifact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
