import type { DojoPacket } from './schema';
import { getSession, getSessionPerspectives, getSessionAssumptions, getSessionDecisions } from '../pglite/sessions';
import { getSessionTraces } from '../pglite/harness';

export async function buildDojoPacket(sessionId: string): Promise<DojoPacket> {
  const session = await getSession(sessionId);
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  const [perspectives, assumptions, decisions] = await Promise.all([
    getSessionPerspectives(sessionId),
    getSessionAssumptions(sessionId),
    getSessionDecisions(sessionId),
  ]);
  
  const traceSummary = await getTraceSummary(sessionId);
  
  const durationMinutes = Math.floor(
    (new Date(session.updated_at).getTime() - new Date(session.created_at).getTime()) / 60000
  );
  
  const packet: DojoPacket = {
    version: '1.0',
    session: {
      id: session.id,
      title: session.title || 'Untitled Session',
      mode: session.mode || 'Mirror',
      duration: durationMinutes,
      created_at: new Date(session.created_at).toISOString(),
      updated_at: new Date(session.updated_at).toISOString(),
      agent_path: session.agent_path || [],
    },
    situation: session.situation || '',
    stake: session.stake || null,
    perspectives: perspectives.map(p => ({
      text: p.text,
      source: p.source,
      timestamp: new Date(p.created_at).toISOString(),
    })),
    assumptions: assumptions.map(a => ({
      text: a.text,
      challenged: a.challenged,
      timestamp: new Date(a.created_at).toISOString(),
    })),
    decisions: decisions.map(d => ({
      text: d.text,
      rationale: d.rationale,
      timestamp: new Date(d.created_at).toISOString(),
    })),
    next_move: {
      action: session.next_move_action || '',
      why: session.next_move_why || '',
      smallest_test: session.next_move_test || null,
    },
    artifacts: session.artifacts || [],
    trace_summary: traceSummary,
    metadata: {
      exported_at: new Date().toISOString(),
      exported_by: session.user_id || null,
      format: 'json',
    },
  };
  
  return packet;
}

async function getTraceSummary(sessionId: string): Promise<{
  total_events: number;
  agent_transitions: number;
  cost_total: number;
  tokens_total: number;
}> {
  try {
    const traces = await getSessionTraces(sessionId);
    
    if (traces.length === 0) {
      return {
        total_events: 0,
        agent_transitions: 0,
        cost_total: 0,
        tokens_total: 0,
      };
    }
    
    const latestTrace = traces[0];
    
    const agentTransitions = countEvents(latestTrace.events, [
      'AGENT_ROUTING',
      'AGENT_HANDOFF',
      'MODE_TRANSITION',
    ]);
    
    return {
      total_events: latestTrace.summary.total_events,
      agent_transitions: agentTransitions,
      cost_total: latestTrace.summary.total_cost_usd,
      tokens_total: latestTrace.summary.total_tokens,
    };
  } catch (error) {
    console.error('[PACKET_BUILDER] Error fetching trace summary:', error);
    return {
      total_events: 0,
      agent_transitions: 0,
      cost_total: 0,
      tokens_total: 0,
    };
  }
}

function countEvents(events: any[], eventTypes: string[]): number {
  let count = 0;
  
  for (const event of events) {
    if (eventTypes.includes(event.event_type)) {
      count++;
    }
    
    if (event.children && event.children.length > 0) {
      count += countEvents(event.children, eventTypes);
    }
  }
  
  return count;
}
