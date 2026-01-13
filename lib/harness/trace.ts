/**
 * Harness Trace Core API
 * 
 * Implements Dataiku's Harness Trace pattern for nested span-based logging.
 * Captures every significant event in a Dojo session for debugging and analytics.
 * 
 * @module harness/trace
 */

import type {
  HarnessTrace,
  HarnessEvent,
  HarnessEventType,
  HarnessMetadata,
  HarnessSummary,
} from './types';
import { generateId, addNestedEvent, updateSpan, countEvents } from './utils';
import { insertTrace } from '../pglite/harness';

let currentTrace: HarnessTrace | null = null;
let eventStack: string[] = [];

/**
 * Starts a new Harness Trace for a session.
 * 
 * Creates a new trace with empty events and initializes summary metrics.
 * Only one trace can be active at a time (per process/thread).
 * 
 * @param sessionId - Session ID this trace belongs to
 * @param userId - User ID who initiated the session
 * @returns The newly created trace
 * 
 * @example
 * ```ts
 * const trace = startTrace('sess_123', 'user_456');
 * console.log(trace.trace_id); // "trace_1234567890_abc123def"
 * ```
 */
export function startTrace(sessionId: string, userId: string): HarnessTrace {
  currentTrace = {
    trace_id: generateId('trace'),
    session_id: sessionId,
    user_id: userId,
    started_at: new Date().toISOString(),
    ended_at: null,
    events: [],
    summary: {
      total_events: 0,
      total_duration_ms: 0,
      total_tokens: 0,
      total_cost_usd: 0,
      agents_used: [],
      modes_used: [],
      errors: 0,
    },
  };

  return currentTrace;
}

/**
 * Logs a single event to the current trace.
 * 
 * If called within a span (between startSpan/endSpan), the event becomes a child
 * of the current span. Otherwise, it's added as a root-level event.
 * 
 * @param eventType - Type of event (USER_INPUT, AGENT_ROUTING, etc.)
 * @param inputs - Input data the event started with
 * @param outputs - Output data the event produced
 * @param metadata - Performance and contextual metadata
 * @returns The span_id of the logged event (empty string if no active trace)
 * 
 * @example
 * ```ts
 * logEvent('USER_INPUT', 
 *   { message: 'Help me plan my budget' }, 
 *   { received: true },
 *   { duration_ms: 5 }
 * );
 * ```
 */
export function logEvent(
  eventType: HarnessEventType,
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  metadata: HarnessMetadata = {}
): string {
  if (!currentTrace) {
    console.warn('[HARNESS_TRACE] No active trace. Call startTrace() first.');
    return '';
  }

  const spanId = generateId('span');
  const parentId = eventStack.length > 0 ? eventStack[eventStack.length - 1] : null;

  const event: HarnessEvent = {
    span_id: spanId,
    parent_id: parentId,
    event_type: eventType,
    timestamp: new Date().toISOString(),
    inputs,
    outputs,
    metadata,
  };

  if (parentId) {
    addNestedEvent(currentTrace.events, parentId, event);
  } else {
    currentTrace.events.push(event);
  }

  updateSummary(eventType, metadata);

  return spanId;
}

/**
 * Starts a new span (nested event) in the trace.
 * 
 * A span represents a hierarchical operation that will be completed later with endSpan().
 * All events logged between startSpan() and endSpan() become children of this span.
 * 
 * @param eventType - Type of event (AGENT_ROUTING, TOOL_INVOCATION, etc.)
 * @param inputs - Input data for this operation
 * @param metadata - Optional metadata (outputs added in endSpan)
 * @returns The span_id (used to close the span with endSpan)
 * 
 * @example
 * ```ts
 * const spanId = startSpan('AGENT_ROUTING', { query: 'Help me budget' });
 * // ... routing logic ...
 * endSpan(spanId, { agent_id: 'dojo', confidence: 0.95 }, { duration_ms: 150 });
 * ```
 */
export function startSpan(
  eventType: HarnessEventType,
  inputs: Record<string, any>,
  metadata: HarnessMetadata = {}
): string {
  const spanId = logEvent(eventType, inputs, {}, metadata);
  eventStack.push(spanId);
  return spanId;
}

/**
 * Ends a span and populates its outputs and metadata.
 * 
 * Must be called with the span_id returned by startSpan().
 * Validates span stack order and logs warnings for mismatches.
 * 
 * @param spanId - The span_id from startSpan()
 * @param outputs - Output data produced by this operation
 * @param metadata - Final metadata (duration, tokens, cost, etc.)
 * 
 * @example
 * ```ts
 * const spanId = startSpan('TOOL_INVOCATION', { tool: 'search', query: 'budget' });
 * const results = await semanticSearch('budget', 5, 0.7);
 * endSpan(spanId, { results_count: results.length }, { duration_ms: 250 });
 * ```
 */
export function endSpan(
  spanId: string,
  outputs: Record<string, any>,
  metadata: HarnessMetadata = {}
): void {
  if (!currentTrace) {
    console.warn('[HARNESS_TRACE] No active trace. Cannot end span.');
    return;
  }

  if (eventStack.length === 0) {
    console.warn('[HARNESS_TRACE] Span stack is empty. Cannot end span:', spanId);
    return;
  }

  const topSpanId = eventStack[eventStack.length - 1];
  if (topSpanId !== spanId) {
    console.warn(
      `[HARNESS_TRACE] Span mismatch. Expected ${topSpanId} but got ${spanId}`
    );
  }

  eventStack.pop();

  updateSpan(currentTrace.events, spanId, outputs, metadata);
  
  updateSummary('AGENT_RESPONSE', metadata);
}

/**
 * Ends the current trace and persists it to the database.
 * 
 * Finalizes the trace by setting ended_at timestamp, computing total event count,
 * and saving to PGlite. Resets the current trace state.
 * 
 * @returns The completed trace
 * @throws Error if no active trace
 * 
 * @example
 * ```ts
 * const trace = startTrace('sess_123', 'user_456');
 * logEvent('USER_INPUT', { message: 'Hello' }, { received: true });
 * const finalTrace = await endTrace();
 * console.log(finalTrace.summary.total_events); // 1
 * ```
 */
export async function endTrace(): Promise<HarnessTrace> {
  if (!currentTrace) {
    throw new Error('[HARNESS_TRACE] No active trace to end.');
  }

  currentTrace.ended_at = new Date().toISOString();
  currentTrace.summary.total_events = countEvents(currentTrace.events);

  const trace = currentTrace;
  currentTrace = null;
  eventStack = [];

  await insertTrace(trace);

  return trace;
}

/**
 * Gets the current active trace (if any).
 * 
 * @returns The current trace or null if no trace is active
 * 
 * @example
 * ```ts
 * const trace = getCurrentTrace();
 * if (trace) {
 *   console.log(`Active trace: ${trace.trace_id}`);
 * }
 * ```
 */
export function getCurrentTrace(): HarnessTrace | null {
  return currentTrace;
}

/**
 * Checks if a trace is currently active.
 * 
 * @returns true if a trace is active, false otherwise
 * 
 * @example
 * ```ts
 * if (!isTraceActive()) {
 *   startTrace('sess_123', 'user_456');
 * }
 * ```
 */
export function isTraceActive(): boolean {
  return currentTrace !== null;
}

/**
 * Updates the trace summary with metrics from an event.
 * 
 * @internal Used by logEvent and endSpan to maintain summary stats
 */
function updateSummary(
  eventType: HarnessEventType,
  metadata: HarnessMetadata
): void {
  if (!currentTrace) return;

  if (metadata.duration_ms) {
    currentTrace.summary.total_duration_ms += metadata.duration_ms;
  }
  if (metadata.token_count) {
    currentTrace.summary.total_tokens += metadata.token_count;
  }
  if (metadata.cost_usd) {
    currentTrace.summary.total_cost_usd += metadata.cost_usd;
  }
  if (eventType === 'ERROR') {
    currentTrace.summary.errors++;
  }

  if (eventType === 'AGENT_ROUTING' && metadata.agent_id) {
    const agentId = String(metadata.agent_id);
    if (!currentTrace.summary.agents_used.includes(agentId)) {
      currentTrace.summary.agents_used.push(agentId);
    }
  }

  if (eventType === 'MODE_TRANSITION' && metadata.mode) {
    const mode = String(metadata.mode);
    if (!currentTrace.summary.modes_used.includes(mode)) {
      currentTrace.summary.modes_used.push(mode);
    }
  }
}
