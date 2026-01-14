import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { buildDojoPacket } from '@/lib/packet/builder';
import { formatAsJSON, formatAsMarkdown, formatAsPDF } from '@/lib/packet/formatters';
import { z } from 'zod';

const exportRequestSchema = z.object({
  sessionId: z.string(),
  format: z.enum(['json', 'markdown', 'pdf']),
});

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function POST(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Packet Export API] Running in dev mode with mock authentication');
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
    
    const validationResult = exportRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request body',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { sessionId, format } = validationResult.data;

    const packet = await buildDojoPacket(sessionId);

    if (!isDevMode() && packet.metadata.exported_by !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - you do not have access to this session' },
        { status: 403 }
      );
    }

    packet.metadata.format = format;

    if (format === 'json') {
      const json = formatAsJSON(packet);
      return new NextResponse(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="dojopacket-${sessionId}.json"`,
        },
      });
    }

    if (format === 'markdown') {
      const markdown = formatAsMarkdown(packet);
      return new NextResponse(markdown, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="dojopacket-${sessionId}.md"`,
        },
      });
    }

    if (format === 'pdf') {
      const pdf = await formatAsPDF(packet);
      const pdfArray = new Uint8Array(pdf);
      return new NextResponse(pdfArray, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="dojopacket-${sessionId}.pdf"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Unsupported format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Packet Export API] Error:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to export packet' },
      { status: 500 }
    );
  }
}
