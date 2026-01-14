import { NextRequest, NextResponse } from 'next/server';
import { getAgentById } from '@/lib/agents/supervisor';
import { AgentNotFoundError } from '@/lib/agents/types';
import { getAgentStatus } from '@/lib/agents/status';
import { getAgentUsageStats } from '@/lib/agents/usage-stats';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

/**
 * GET /api/agents/[agentId]
 * 
 * Returns detailed information for a specific agent, including:
 * - Agent metadata (id, name, icon, tagline, description)
 * - Usage statistics (query count, cost, avg tokens, last used)
 * - Computed status (online/offline/deprecated)
 * 
 * Errors:
 * - 404: Agent not found
 * - 500: Database or server error
 * 
 * Dev Mode:
 * - No authentication required when NEXT_PUBLIC_DEV_MODE=true
 * 
 * @param agentId - Unique agent identifier from URL path
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/agents/dojo');
 * const agent = await response.json();
 * console.log(agent.usage_stats.query_count);
 * ```
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    if (isDevMode()) {
      console.log(`[Agent Details API] Dev mode - fetching agent: ${params.agentId}`);
    }

    const agent = getAgentById(params.agentId);
    const status = getAgentStatus(params.agentId);
    const usage_stats = await getAgentUsageStats(params.agentId);

    return NextResponse.json({
      id: agent.id,
      name: agent.name,
      icon: agent.icon,
      tagline: agent.tagline,
      description: agent.description,
      when_to_use: agent.when_to_use,
      when_not_to_use: agent.when_not_to_use,
      default: agent.default,
      status,
      usage_stats,
    });
  } catch (error) {
    if (error instanceof AgentNotFoundError) {
      return NextResponse.json(
        { error: `Agent '${params.agentId}' not found` },
        { status: 404 }
      );
    }

    console.error('[Agent Details API] Error fetching agent:', error);

    return NextResponse.json(
      { error: 'Failed to fetch agent details' },
      { status: 500 }
    );
  }
}
