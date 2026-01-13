import { getDB } from '../pglite/client';
import {
  HandoffContext,
  AgentInvocationContext,
  HandoffError,
  ChatMessage,
} from './types';
import { getAgentById, isValidAgentId } from './supervisor';

export interface HandoffEvent {
  id: string;
  session_id: string;
  from_agent: string;
  to_agent: string;
  reason: string;
  conversation_history: ChatMessage[];
  harness_trace_id?: string | null;
  user_intent: string;
  created_at: string;
}

export interface HarnessTraceEvent {
  event_type: string;
  from_agent?: string;
  to_agent?: string;
  reason?: string;
  timestamp: string;
  session_id?: string;
  conversation_length?: number;
  error?: string;
  [key: string]: unknown;
}

export async function executeHandoff(context: HandoffContext): Promise<void> {
  try {
    validateHandoffContext(context);
    await validateAgentAvailability(context.from_agent, context.to_agent);
    
    await storeHandoffEvent(context);
    
    await logHarnessEvent({
      event_type: 'AGENT_HANDOFF',
      from_agent: context.from_agent,
      to_agent: context.to_agent,
      reason: context.reason,
      timestamp: new Date().toISOString(),
      session_id: context.session_id,
      conversation_length: context.conversation_history.length,
    });

    const invocationContext: AgentInvocationContext = {
      conversation_history: context.conversation_history,
      harness_trace_id: context.harness_trace_id,
      user_intent: context.user_intent,
      session_id: context.session_id,
    };

    await invokeAgent(context.to_agent, invocationContext);

    console.log(`[HANDOFF] Successfully handed off from ${context.from_agent} to ${context.to_agent}`);
  } catch (error) {
    await logHarnessEvent({
      event_type: 'HANDOFF_FAILURE',
      from_agent: context.from_agent,
      to_agent: context.to_agent,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      session_id: context.session_id,
    }).catch((logError) => {
      console.error('[HANDOFF] Failed to log handoff failure:', logError);
    });

    throw new HandoffError(
      `Failed to execute handoff from ${context.from_agent} to ${context.to_agent}`,
      context.from_agent,
      context.to_agent,
      error
    );
  }
}

export async function storeHandoffEvent(context: HandoffContext): Promise<string> {
  const db = await getDB();

  try {
    const result = await db.query<{ id: string }>(
      `INSERT INTO agent_handoffs 
        (session_id, from_agent, to_agent, reason, conversation_history, harness_trace_id, user_intent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        context.session_id,
        context.from_agent,
        context.to_agent,
        context.reason,
        JSON.stringify(context.conversation_history),
        context.harness_trace_id || null,
        context.user_intent,
      ]
    );

    if (!result.rows[0]) {
      throw new Error('Failed to insert handoff event');
    }

    return result.rows[0].id;
  } catch (error) {
    console.error('[HANDOFF] Error storing handoff event:', error);
    throw new HandoffError(
      'Failed to store handoff event in database',
      context.from_agent,
      context.to_agent,
      error
    );
  }
}

export async function getHandoffHistory(sessionId: string): Promise<HandoffEvent[]> {
  const db = await getDB();

  try {
    const result = await db.query<HandoffEvent>(
      `SELECT 
        id,
        session_id,
        from_agent,
        to_agent,
        reason,
        conversation_history,
        harness_trace_id,
        user_intent,
        created_at
      FROM agent_handoffs
      WHERE session_id = $1
      ORDER BY created_at ASC`,
      [sessionId]
    );

    return result.rows.map((row) => ({
      ...row,
      conversation_history: typeof row.conversation_history === 'string'
        ? JSON.parse(row.conversation_history)
        : row.conversation_history,
      created_at: new Date(row.created_at).toISOString(),
    }));
  } catch (error) {
    console.error('[HANDOFF] Error retrieving handoff history:', error);
    return [];
  }
}

export async function getLastHandoff(sessionId: string): Promise<HandoffEvent | null> {
  const db = await getDB();

  try {
    const result = await db.query<HandoffEvent>(
      `SELECT 
        id,
        session_id,
        from_agent,
        to_agent,
        reason,
        conversation_history,
        harness_trace_id,
        user_intent,
        created_at
      FROM agent_handoffs
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      conversation_history: typeof row.conversation_history === 'string'
        ? JSON.parse(row.conversation_history)
        : row.conversation_history,
      created_at: new Date(row.created_at).toISOString(),
    };
  } catch (error) {
    console.error('[HANDOFF] Error retrieving last handoff:', error);
    return null;
  }
}

export async function getHandoffCount(
  sessionId: string,
  fromAgent?: string,
  toAgent?: string
): Promise<number> {
  const db = await getDB();

  try {
    let query = 'SELECT COUNT(*) as count FROM agent_handoffs WHERE session_id = $1';
    const params: (string | number)[] = [sessionId];

    if (fromAgent) {
      params.push(fromAgent);
      query += ` AND from_agent = $${params.length}`;
    }

    if (toAgent) {
      params.push(toAgent);
      query += ` AND to_agent = $${params.length}`;
    }

    const result = await db.query<{ count: string }>(query, params);
    return parseInt(result.rows[0]?.count || '0', 10);
  } catch (error) {
    console.error('[HANDOFF] Error getting handoff count:', error);
    return 0;
  }
}

export async function logHarnessEvent(event: HarnessTraceEvent): Promise<void> {
  console.log('[HARNESS_TRACE]', JSON.stringify(event, null, 2));
}

export async function invokeAgent(
  agentId: string,
  context: AgentInvocationContext
): Promise<void> {
  console.log(`[AGENT_INVOKE] Invoking agent: ${agentId}`);
  console.log(`[AGENT_INVOKE] Context:`, {
    session_id: context.session_id,
    conversation_length: context.conversation_history.length,
    user_intent: context.user_intent,
    harness_trace_id: context.harness_trace_id,
  });
}

function validateHandoffContext(context: HandoffContext): void {
  if (!context.session_id || context.session_id.trim() === '') {
    throw new HandoffError(
      'session_id is required',
      context.from_agent || 'unknown',
      context.to_agent || 'unknown'
    );
  }

  if (!context.from_agent || context.from_agent.trim() === '') {
    throw new HandoffError(
      'from_agent is required',
      'unknown',
      context.to_agent || 'unknown'
    );
  }

  if (!context.to_agent || context.to_agent.trim() === '') {
    throw new HandoffError(
      'to_agent is required',
      context.from_agent,
      'unknown'
    );
  }

  if (context.from_agent === context.to_agent) {
    throw new HandoffError(
      'Cannot handoff to the same agent',
      context.from_agent,
      context.to_agent
    );
  }

  if (!context.reason || context.reason.trim() === '') {
    throw new HandoffError(
      'reason is required',
      context.from_agent,
      context.to_agent
    );
  }

  if (!Array.isArray(context.conversation_history)) {
    throw new HandoffError(
      'conversation_history must be an array',
      context.from_agent,
      context.to_agent
    );
  }

  if (!context.user_intent || context.user_intent.trim() === '') {
    throw new HandoffError(
      'user_intent is required',
      context.from_agent,
      context.to_agent
    );
  }
}

async function validateAgentAvailability(fromAgent: string, toAgent: string): Promise<void> {
  if (!isValidAgentId(fromAgent)) {
    throw new HandoffError(
      `Source agent is not available: ${fromAgent}`,
      fromAgent,
      toAgent
    );
  }

  if (!isValidAgentId(toAgent)) {
    throw new HandoffError(
      `Target agent is not available: ${toAgent}`,
      fromAgent,
      toAgent
    );
  }

  const targetAgentConfig = getAgentById(toAgent);
  if (!targetAgentConfig) {
    throw new HandoffError(
      `Target agent configuration not found: ${toAgent}`,
      fromAgent,
      toAgent
    );
  }
}
