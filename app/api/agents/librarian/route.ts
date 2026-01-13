/**
 * Librarian Agent API Endpoint
 * 
 * Provides direct access to the Librarian agent for executing search queries.
 * This endpoint is used when routing from the Supervisor or for direct invocation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { handleLibrarianQuery, formatLibrarianResponse, type LibrarianQuery } from '@/lib/agents/librarian-handler';
import { z } from 'zod';

const LibrarianRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  session_id: z.string().min(1, 'Session ID is required'),
  conversation_context: z.array(z.object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    agent_id: z.string().optional(),
    timestamp: z.string().optional(),
  })).optional().default([]),
  filters: z.object({
    status: z.union([
      z.enum(['seedling', 'active', 'composted', 'archive']),
      z.array(z.enum(['seedling', 'active', 'composted', 'archive'])),
    ]).optional(),
    tags: z.array(z.string()).optional(),
    threshold: z.number().min(0).max(1).optional(),
    limit: z.number().min(1).max(100).optional(),
  }).optional(),
  format: z.enum(['json', 'text']).optional().default('json'),
});

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const isDev = process.env.NODE_ENV === 'development';
    let userId: string | undefined;

    if (!isDev) {
      const session = await auth();
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in' },
          { status: 401 }
        );
      }
      userId = session.user.id;
    } else {
      userId = 'dev-user';
    }

    // Parse and validate request
    const body = await request.json();
    const validated = LibrarianRequestSchema.parse(body);

    // Construct Librarian query
    const librarianQuery: LibrarianQuery = {
      query: validated.query,
      conversationContext: validated.conversation_context,
      sessionId: validated.session_id,
      userId,
      filters: validated.filters as any, // Type assertion for filter compatibility
    };

    // Execute Librarian handler
    const response = await handleLibrarianQuery(librarianQuery);

    // Return formatted response based on format preference
    if (validated.format === 'text') {
      const formattedText = formatLibrarianResponse(response);
      return NextResponse.json({
        message: formattedText,
        metadata: {
          count: response.count,
          duration_ms: response.duration_ms,
          cost: response.cost,
        },
      });
    }

    // Return full JSON response
    return NextResponse.json(response);

  } catch (error) {
    console.error('[Librarian API] Error executing query:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Handle generic errors
    return NextResponse.json(
      {
        error: 'Failed to execute Librarian query',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      agent: 'librarian',
      version: '1.0.0',
      description: 'Semantic search and retrieval agent',
      capabilities: [
        'Semantic search across prompts',
        'Proactive suggestions',
        'Conversation context integration',
        'Cost tracking',
      ],
      endpoints: {
        POST: {
          description: 'Execute a search query',
          parameters: {
            query: 'string (required) - Search query',
            session_id: 'string (required) - Session identifier',
            conversation_context: 'array (optional) - Chat history',
            filters: 'object (optional) - Search filters',
            format: 'string (optional) - Response format: json|text',
          },
        },
      },
    },
    { status: 200 }
  );
}
