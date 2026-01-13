/**
 * Types of events that can be logged in the Harness Trace system.
 * 
 * Based on Dataiku's Harness Trace pattern for capturing agent execution flows.
 */
export type HarnessEventType =
  | 'SESSION_START'           // User session begins
  | 'SESSION_END'             // User session ends
  | 'MODE_TRANSITION'         // Dojo mode change (Mirror, Scout, etc.)
  | 'AGENT_ROUTING'           // Supervisor routing decision
  | 'AGENT_HANDOFF'           // Handoff between agents
  | 'TOOL_INVOCATION'         // External tool call (search, API, etc.)
  | 'PERSPECTIVE_INTEGRATION' // User perspective added
  | 'COST_TRACKED'            // Cost Guard event
  | 'CONTEXT_BUILD'           // Context builder applied
  | 'SAFETY_SWITCH'           // Safety Switch activated/deactivated
  | 'ERROR'                   // Error occurred
  | 'USER_INPUT'              // User message
  | 'AGENT_RESPONSE';         // Agent response

/**
 * Extensible metadata for trace events.
 * 
 * Contains performance metrics, costs, and contextual information about an event.
 */
export interface HarnessMetadata {
  /** Duration of the event in milliseconds */
  duration_ms?: number;
  /** Number of tokens used (for LLM calls) */
  token_count?: number;
  /** Cost in USD (for paid operations) */
  cost_usd?: number;
  /** Confidence score (0-1) for routing/predictions */
  confidence?: number;
  /** Error message if event_type is ERROR */
  error_message?: string;
  /** Additional custom metadata fields */
  [key: string]: any;
}

/**
 * A single event in the Harness Trace tree.
 * 
 * Events can be nested (parent-child relationships) to represent hierarchical workflows.
 */
export interface HarnessEvent {
  /** Unique identifier for this event (e.g., "span_001") */
  span_id: string;
  /** ID of parent event (null for root-level events) */
  parent_id: string | null;
  /** Type of event (routing, handoff, error, etc.) */
  event_type: HarnessEventType;
  /** ISO 8601 timestamp when event occurred */
  timestamp: string;
  /** Input data the event started with */
  inputs: Record<string, any>;
  /** Output data the event produced */
  outputs: Record<string, any>;
  /** Performance and contextual metadata */
  metadata: HarnessMetadata;
  /** Nested child events */
  children?: HarnessEvent[];
}

/**
 * Aggregated summary metrics for a trace.
 * 
 * Computed from all events in the trace tree.
 */
export interface HarnessSummary {
  /** Total number of events (including nested) */
  total_events: number;
  /** Total duration across all events (ms) */
  total_duration_ms: number;
  /** Total tokens used across all events */
  total_tokens: number;
  /** Total cost in USD across all events */
  total_cost_usd: number;
  /** List of unique agent IDs used */
  agents_used: string[];
  /** List of unique Dojo modes used */
  modes_used: string[];
  /** Count of ERROR events */
  errors: number;
}

/**
 * A complete Harness Trace for a session.
 * 
 * Captures all events (nested) and summary metrics for debugging and analytics.
 * 
 * @example
 * ```ts
 * const trace = startTrace('sess_123', 'user_456');
 * logEvent('USER_INPUT', { message: 'Hello' }, { received: true });
 * await endTrace();
 * ```
 */
export interface HarnessTrace {
  /** Unique identifier for this trace */
  trace_id: string;
  /** Session this trace belongs to */
  session_id: string;
  /** User who initiated the session */
  user_id: string;
  /** ISO 8601 timestamp when trace started */
  started_at: string;
  /** ISO 8601 timestamp when trace ended (null if ongoing) */
  ended_at: string | null;
  /** Root-level events (may contain nested children) */
  events: HarnessEvent[];
  /** Computed summary metrics */
  summary: HarnessSummary;
}
