export interface Agent {
  id: string;
  name: string;
  description: string;
  when_to_use: string[];
  when_not_to_use: string[];
  default: boolean;
}

export interface AgentRegistry {
  agents: Agent[];
}

export interface RoutingDecision {
  agent_id: string;
  agent_name?: string;
  confidence: number;
  reasoning: string;
  fallback?: boolean;
}

export interface RoutingContext {
  query: string;
  conversation_context: string[];
  session_id: string;
  available_agents: Agent[];
}

export interface RoutingResult extends RoutingDecision {
  routing_cost?: {
    tokens_used: number;
    cost_usd: number;
  };
}

export interface HandoffContext {
  from_agent: string;
  to_agent: string;
  reason: string;
  conversation_history: ChatMessage[];
  harness_trace_id?: string | null;
  user_intent: string;
  session_id: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent_id?: string;
  timestamp?: string;
}

export interface AgentInvocationContext {
  conversation_history: ChatMessage[];
  harness_trace_id?: string | null;
  user_intent: string;
  session_id: string;
}

export class AgentError extends Error {
  constructor(
    message: string,
    public code?: string,
    public agentId?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class RoutingError extends AgentError {
  constructor(message: string, details?: unknown) {
    super(message, 'ROUTING_ERROR', undefined, details);
    this.name = 'RoutingError';
  }
}

export class AgentNotFoundError extends AgentError {
  constructor(agentId: string) {
    super(`Agent not found: ${agentId}`, 'AGENT_NOT_FOUND', agentId);
    this.name = 'AgentNotFoundError';
  }
}

export class HandoffError extends AgentError {
  constructor(message: string, fromAgent: string, toAgent: string, details?: unknown) {
    super(message, 'HANDOFF_ERROR', `${fromAgent}->${toAgent}`, details);
    this.name = 'HandoffError';
  }
}

export const AGENT_IDS = {
  DOJO: 'dojo',
  LIBRARIAN: 'librarian',
  DEBUGGER: 'debugger',
} as const;

export type AgentId = typeof AGENT_IDS[keyof typeof AGENT_IDS];
