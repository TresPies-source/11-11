import type { HarnessEvent, HarnessMetadata } from './types';

/**
 * Generates a unique ID with a prefix.
 * 
 * @param prefix - Prefix for the ID (e.g., "trace", "span")
 * @returns Unique ID in format: `{prefix}_{timestamp}_{random}`
 * 
 * @example
 * ```ts
 * const traceId = generateId('trace'); // "trace_1234567890_abc123def"
 * const spanId = generateId('span');   // "span_1234567890_xyz789ghi"
 * ```
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Adds a child event to a parent event in the trace tree.
 * 
 * Recursively searches for the parent event and appends the child to its children array.
 * 
 * @param events - Root-level events array
 * @param parentId - span_id of the parent event
 * @param event - Child event to add
 * @returns true if parent found and child added, false otherwise
 * 
 * @internal Used by trace.ts to build nested event structure
 */
export function addNestedEvent(
  events: HarnessEvent[],
  parentId: string,
  event: HarnessEvent
): boolean {
  for (const e of events) {
    if (e.span_id === parentId) {
      if (!e.children) {
        e.children = [];
      }
      e.children.push(event);
      return true;
    }
    if (e.children && addNestedEvent(e.children, parentId, event)) {
      return true;
    }
  }
  return false;
}

/**
 * Updates an existing span with outputs and metadata.
 * 
 * Used by endSpan() to populate a span's results after completion.
 * 
 * @param events - Root-level events array
 * @param spanId - span_id of the event to update
 * @param outputs - Output data to merge
 * @param metadata - Metadata to merge
 * @returns true if span found and updated, false otherwise
 * 
 * @internal Used by trace.ts when closing spans
 */
export function updateSpan(
  events: HarnessEvent[],
  spanId: string,
  outputs: Record<string, any>,
  metadata: HarnessMetadata
): boolean {
  for (const e of events) {
    if (e.span_id === spanId) {
      e.outputs = { ...e.outputs, ...outputs };
      e.metadata = { ...e.metadata, ...metadata };
      return true;
    }
    if (e.children && updateSpan(e.children, spanId, outputs, metadata)) {
      return true;
    }
  }
  return false;
}

/**
 * Finds an event by its span_id in the trace tree.
 * 
 * @param events - Root-level events array
 * @param spanId - span_id to search for
 * @returns The event if found, null otherwise
 * 
 * @example
 * ```ts
 * const event = findEvent(trace.events, 'span_123');
 * if (event) {
 *   console.log(event.event_type, event.metadata);
 * }
 * ```
 */
export function findEvent(
  events: HarnessEvent[],
  spanId: string
): HarnessEvent | null {
  for (const e of events) {
    if (e.span_id === spanId) {
      return e;
    }
    if (e.children) {
      const found = findEvent(e.children, spanId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Counts total events in the trace tree (including nested children).
 * 
 * @param events - Root-level events array
 * @returns Total count of events
 * 
 * @example
 * ```ts
 * const total = countEvents(trace.events); // 25 (including all nested events)
 * ```
 */
export function countEvents(events: HarnessEvent[]): number {
  let count = events.length;
  for (const e of events) {
    if (e.children) {
      count += countEvents(e.children);
    }
  }
  return count;
}
