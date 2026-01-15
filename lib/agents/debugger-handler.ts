/**
 * Debugger Agent Handler
 * 
 * Handles conflict resolution and reasoning validation queries from the Supervisor.
 * Analyzes user perspectives and assumptions to identify contradictions and logical issues.
 * 
 * @module lib/agents/debugger-handler
 */

import type { AgentInvocationContext, ChatMessage } from './types';
import { AgentError } from './types';
import type { Perspective, Assumption, DojoPacket } from '../packet/schema';
import { DojoPacketSchema } from '../packet/schema';
import { logEvent, startSpan, endSpan } from '../harness/trace';
import { LLMClient } from '../llm/client';

export interface Conflict {
  description: string;
  conflicting_perspectives: string[];
}

export interface DebuggerAgentQuery {
  perspectives: Perspective[];
  assumptions: Assumption[];
}

export interface DebuggerAgentResponse {
  conflicts: Conflict[];
  summary: string;
}

export interface ReasoningAnalysis {
  summary: string;
  conflicts: Conflict[];
}

export class DebuggerAgentError extends AgentError {
  constructor(
    message: string,
    code?: string,
    details?: unknown
  ) {
    super(message, code, 'debugger', details);
    this.name = 'DebuggerAgentError';
  }
}

/**
 * Analyzes perspectives and assumptions to identify conflicts and logical issues.
 * Makes an LLM call to perform reasoning validation.
 * 
 * @param perspectives - Array of user perspectives to analyze
 * @param assumptions - Array of user assumptions to validate
 * @returns ReasoningAnalysis with summary and identified conflicts
 * @throws DebuggerAgentError if analysis fails
 */
async function analyzeReasoning(
  perspectives: Perspective[],
  assumptions: Assumption[]
): Promise<ReasoningAnalysis> {
  const llmClient = new LLMClient();

  const spanId = startSpan('TOOL_INVOCATION', {
    tool: 'llm',
    operation: 'reasoning_analysis',
    model: 'deepseek-chat',
  });

  try {
    const perspectivesText = perspectives.length > 0
      ? `\n\nPerspectives to analyze:\n${perspectives.map((p, i) => `${i + 1}. "${p.text}" (Source: ${p.source})`).join('\n')}`
      : '';

    const assumptionsText = assumptions.length > 0
      ? `\n\nAssumptions to validate:\n${assumptions.map((a, i) => `${i + 1}. "${a.text}"${a.challenged ? ' (challenged)' : ''}`).join('\n')}`
      : '';

    const systemPrompt = `You are a reasoning validator and conflict analyst. Analyze the provided perspectives and assumptions to identify:
1. Contradictions between perspectives
2. Logical fallacies or inconsistencies
3. Unstated biases or assumptions
4. Areas where perspectives conflict

Return a JSON object with this exact structure:
{
  "summary": "High-level summary of reasoning issues found",
  "conflicts": [
    {
      "description": "Clear description of the conflict",
      "conflicting_perspectives": ["text of first perspective", "text of second perspective"]
    }
  ]
}

Rules:
- Be specific about what conflicts exist
- Quote the exact conflicting perspectives
- If no conflicts found, return empty conflicts array
- Focus on logical contradictions, not just differences of opinion
- Identify unstated assumptions that create conflicts`;

    const userPrompt = `Analyze the following for conflicts and logical issues:${perspectivesText}${assumptionsText}

Identify any contradictions, logical fallacies, or conflicts in reasoning.`;

    const response = await llmClient.call('deepseek-chat', [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.5,
      responseFormat: { type: 'json_object' },
      timeout: 60000,
    });

    const analysis = JSON.parse(response.content) as ReasoningAnalysis;

    endSpan(spanId, {
      success: true,
      conflict_count: analysis.conflicts.length,
    }, {
      token_count: response.usage.total_tokens,
    });

    return analysis;
  } catch (error) {
    endSpan(spanId, {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, {});

    throw new DebuggerAgentError(
      `Reasoning analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      'ANALYSIS_FAILED',
      error
    );
  }
}

/**
 * Parses perspectives from conversation history when DojoPacket is unavailable.
 * Extracts user messages and splits them into perspective-like statements.
 * 
 * @param conversationHistory - Array of chat messages to parse
 * @param limit - Maximum number of perspectives to extract (default: 10)
 * @returns Array of Perspective objects derived from user messages
 */
function parsePerspectivesFromConversation(
  conversationHistory: ChatMessage[],
  limit: number = 10
): Perspective[] {
  const perspectives: Perspective[] = [];
  
  if (!conversationHistory || conversationHistory.length === 0) {
    return perspectives;
  }
  
  const userMessages = conversationHistory
    .filter(msg => msg.role === 'user')
    .slice(-limit);
  
  for (const message of userMessages) {
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const sentences = message.content.match(sentenceRegex) || [message.content];
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      
      if (trimmed.length < 10) {
        continue;
      }
      
      perspectives.push({
        text: trimmed,
        source: 'user',
        timestamp: message.timestamp || new Date().toISOString(),
      });
    }
  }
  
  return perspectives.slice(0, limit);
}

/**
 * Extracts a DojoPacket from conversation history.
 * Searches messages in reverse order for valid DojoPacket JSON.
 * 
 * @param conversationHistory - Array of chat messages to search
 * @returns DojoPacket if found and valid, null otherwise
 */
function extractDojoPacket(conversationHistory: ChatMessage[]): DojoPacket | null {
  const jsonRegex = /\{[\s\S]*?"version"\s*:\s*"1\.0"[\s\S]*?\}/g;
  
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const message = conversationHistory[i];
    const matches = message.content.match(jsonRegex);
    
    if (!matches) continue;
    
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match);
        const validated = DojoPacketSchema.parse(parsed);
        
        logEvent('AGENT_ACTIVITY_PROGRESS',
          {
            agent_id: 'debugger',
            message: 'DojoPacket extracted from conversation',
            message_index: i,
          },
          {}
        );
        
        return validated;
      } catch (error) {
        continue;
      }
    }
  }
  
  return null;
}

/**
 * Main handler for debugger queries.
 * Orchestrates the reasoning analysis flow and provides comprehensive error handling.
 * 
 * @param query - DebuggerAgentQuery with perspectives and assumptions to analyze
 * @returns DebuggerAgentResponse with conflicts and summary
 * @throws DebuggerAgentError if validation fails or analysis errors occur
 */
export async function handleDebuggerQuery(
  query: DebuggerAgentQuery
): Promise<DebuggerAgentResponse> {
  const startTime = Date.now();

  if (query.perspectives.length === 0 && query.assumptions.length === 0) {
    throw new DebuggerAgentError(
      'At least one perspective or assumption is required for analysis',
      'EMPTY_QUERY'
    );
  }

  logEvent('AGENT_ACTIVITY_START',
    {
      agent_id: 'debugger',
      activity_type: 'reasoning_analysis',
      perspective_count: query.perspectives.length,
      assumption_count: query.assumptions.length,
    },
    {}
  );

  try {
    const analysis = await analyzeReasoning(query.perspectives, query.assumptions);

    const duration = Date.now() - startTime;

    logEvent('AGENT_ACTIVITY_COMPLETE',
      {
        agent_id: 'debugger',
        activity_type: 'reasoning_analysis',
        conflict_count: analysis.conflicts.length,
        duration_ms: duration,
      },
      {}
    );

    return {
      conflicts: analysis.conflicts,
      summary: analysis.summary,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logEvent('ERROR',
      {
        agent_id: 'debugger',
        activity_type: 'reasoning_analysis',
        duration_ms: duration,
      },
      { error: errorMessage },
      { error_message: errorMessage }
    );

    if (error instanceof DebuggerAgentError) {
      throw error;
    }

    throw new DebuggerAgentError(
      `Analysis handler failed: ${errorMessage}`,
      'HANDLER_ERROR',
      error
    );
  }
}

/**
 * Invokes the Debugger Agent from the Supervisor.
 * Entry point for agent handoff system.
 * 
 * @param context - AgentInvocationContext with conversation history and user intent
 * @returns DebuggerAgentResponse with conflicts and summary
 * @throws DebuggerAgentError if invocation fails
 */
export async function invokeDebuggerAgent(
  context: AgentInvocationContext
): Promise<DebuggerAgentResponse> {
  let perspectives: Perspective[] = [];
  let assumptions: Assumption[] = [];
  let strategy = 'conversation_parsing';

  const packet = extractDojoPacket(context.conversation_history);
  
  if (packet) {
    perspectives = packet.perspectives || [];
    assumptions = packet.assumptions || [];
    strategy = 'dojo_packet';
    
    logEvent('AGENT_ACTIVITY_PROGRESS',
      {
        agent_id: 'debugger',
        message: 'Using DojoPacket extraction strategy',
        perspective_count: perspectives.length,
        assumption_count: assumptions.length,
      },
      {}
    );
  } else {
    perspectives = parsePerspectivesFromConversation(context.conversation_history);
    assumptions = [];
    
    logEvent('AGENT_ACTIVITY_PROGRESS',
      {
        agent_id: 'debugger',
        message: 'Using conversation parsing fallback strategy',
        perspective_count: perspectives.length,
      },
      {}
    );
  }

  const query: DebuggerAgentQuery = {
    perspectives,
    assumptions,
  };

  const response = await handleDebuggerQuery(query);

  logEvent('AGENT_ACTIVITY_COMPLETE',
    {
      agent_id: 'debugger',
      activity: 'agent_invocation',
      message: `Debugger agent completed: ${response.conflicts.length} conflict(s) found using ${strategy}`,
    },
    {},
    {
      agent_id: 'debugger',
      conflict_count: response.conflicts.length,
      strategy,
    }
  );

  return response;
}
