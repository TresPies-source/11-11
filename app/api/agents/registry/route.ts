import { NextRequest, NextResponse } from 'next/server';
import { getAvailableAgents } from '@/lib/agents/supervisor';
import { getAgentStatus } from '@/lib/agents/status';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

/**
 * GET /api/agents/registry
 * 
 * Returns the complete agent registry with metadata and computed status.
 * 
 * Response:
 * - agents: Array of agent objects with id, name, icon, tagline, description, status
 * 
 * Dev Mode:
 * - No authentication required when NEXT_PUBLIC_DEV_MODE=true
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/agents/registry');
 * const { agents } = await response.json();
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    if (isDevMode()) {
      console.log('[Agent Registry API] Dev mode - fetching all agents');
    }

    const agents = getAvailableAgents();

    return NextResponse.json({
      agents: agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        icon: agent.icon,
        tagline: agent.tagline,
        description: agent.description,
        when_to_use: agent.when_to_use,
        when_not_to_use: agent.when_not_to_use,
        default: agent.default,
        status: getAgentStatus(agent.id),
      })),
    });
  } catch (error) {
    console.error('[Agent Registry API] Error fetching agents:', error);

    return NextResponse.json(
      { error: 'Failed to fetch agent registry' },
      { status: 500 }
    );
  }
}
