export {
  startTrace,
  logEvent,
  startSpan,
  endSpan,
  endTrace,
  getCurrentTrace,
  isTraceActive,
} from './trace';

export {
  getTrace,
  getSessionTraces,
  getUserTraces,
} from './retrieval';

export type {
  HarnessTrace,
  HarnessEvent,
  HarnessEventType,
  HarnessMetadata,
  HarnessSummary,
} from './types';

export {
  generateId,
  addNestedEvent,
  updateSpan,
  findEvent,
  countEvents,
} from './utils';
