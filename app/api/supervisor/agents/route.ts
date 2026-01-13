import { NextRequest, NextResponse } from 'next/server';
import { getAvailableAgents } from '@/lib/agents/supervisor';
import { isDevMode } from '@/lib/openai/client';

export async function GET(request: NextRequest) {
  try {
    if (isDevMode()) {
      console.log('[Supervisor API] Dev mode - fetching available agents');
    }

    const agents = getAvailableAgents();

    return NextResponse.json({
      agents: agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        when_to_use: agent.when_to_use,
        when_not_to_use: agent.when_not_to_use,
        default: agent.default,
      })),
    });
  } catch (error) {
    console.error('[Supervisor API] Error fetching agents:', error);

    return NextResponse.json(
      { error: 'Failed to fetch available agents' },
      { status: 500 }
    );
  }
}
