export type HarnessEventType =
  | 'SESSION_START'
  | 'SESSION_END'
  | 'MODE_TRANSITION'
  | 'AGENT_ROUTING'
  | 'AGENT_HANDOFF'
  | 'TOOL_INVOCATION'
  | 'PERSPECTIVE_INTEGRATION'
  | 'COST_TRACKED'
  | 'ERROR'
  | 'USER_INPUT'
  | 'AGENT_RESPONSE';

export interface HarnessMetadata {
  duration_ms?: number;
  token_count?: number;
  cost_usd?: number;
  confidence?: number;
  error_message?: string;
  [key: string]: any;
}

export interface HarnessEvent {
  span_id: string;
  parent_id: string | null;
  event_type: HarnessEventType;
  timestamp: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  metadata: HarnessMetadata;
  children?: HarnessEvent[];
}

export interface HarnessSummary {
  total_events: number;
  total_duration_ms: number;
  total_tokens: number;
  total_cost_usd: number;
  agents_used: string[];
  modes_used: string[];
  errors: number;
}

export interface HarnessTrace {
  trace_id: string;
  session_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  events: HarnessEvent[];
  summary: HarnessSummary;
}
