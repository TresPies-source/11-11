import type { HarnessEvent, HarnessMetadata } from './types';

export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${prefix}_${timestamp}_${random}`;
}

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

export function countEvents(events: HarnessEvent[]): number {
  let count = events.length;
  for (const e of events) {
    if (e.children) {
      count += countEvents(e.children);
    }
  }
  return count;
}
