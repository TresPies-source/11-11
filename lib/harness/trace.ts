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

export function startSpan(
  eventType: HarnessEventType,
  inputs: Record<string, any>,
  metadata: HarnessMetadata = {}
): string {
  const spanId = logEvent(eventType, inputs, {}, metadata);
  eventStack.push(spanId);
  return spanId;
}

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

export function getCurrentTrace(): HarnessTrace | null {
  return currentTrace;
}

export function isTraceActive(): boolean {
  return currentTrace !== null;
}

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
