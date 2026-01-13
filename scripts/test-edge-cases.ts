import { startTrace, logEvent, startSpan, endSpan, endTrace, getCurrentTrace, isTraceActive } from '../lib/harness/trace';
import { getTrace, insertTrace } from '../lib/pglite/harness';
import type { HarnessTrace } from '../lib/harness/types';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log(`✓ ${name}`);
    } catch (error) {
      results.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.error(`✗ ${name}: ${error}`);
    }
  };
}

async function runTests() {
  console.log('Running Harness Trace Edge Case Tests\n');

  await test('Empty trace (zero events)', async () => {
  const trace = startTrace('sess_empty', 'user_empty');
  const finalTrace = await endTrace();
  
  if (finalTrace.summary.total_events !== 0) {
    throw new Error(`Expected 0 events, got ${finalTrace.summary.total_events}`);
  }
  if (finalTrace.events.length !== 0) {
    throw new Error(`Expected 0 event array length, got ${finalTrace.events.length}`);
  }
})();

await test('Very long trace (100+ events)', async () => {
  const trace = startTrace('sess_long', 'user_long');
  
  for (let i = 0; i < 150; i++) {
    logEvent(
      'USER_INPUT',
      { message: `Message ${i}` },
      { received: true },
      { duration_ms: Math.random() * 100 }
    );
  }
  
  const finalTrace = await endTrace();
  
  if (finalTrace.summary.total_events !== 150) {
    throw new Error(`Expected 150 events, got ${finalTrace.summary.total_events}`);
  }
})();

await test('Span mismatch (ending wrong span)', async () => {
  const trace = startTrace('sess_mismatch', 'user_mismatch');
  
  const span1 = startSpan('AGENT_ROUTING', { query: 'test1' });
  const span2 = startSpan('TOOL_INVOCATION', { tool: 'search' });
  
  endSpan(span1, { result: 'wrong order' });
  
  if (getCurrentTrace()?.events.length === 0) {
    throw new Error('Expected events to be logged despite mismatch');
  }
  
  await endTrace();
})();

await test('Calling logEvent without active trace', () => {
  if (isTraceActive()) {
    throw new Error('Test setup error: trace should not be active');
  }
  
  const spanId = logEvent('USER_INPUT', { test: true }, { result: true });
  
  if (spanId !== '') {
    throw new Error('Expected empty string when no active trace');
  }
})();

await test('Calling endSpan without active trace', () => {
  if (isTraceActive()) {
    throw new Error('Test setup error: trace should not be active');
  }
  
  endSpan('fake_span_id', { test: true });
})();

await test('Calling endTrace without active trace', async () => {
  if (isTraceActive()) {
    throw new Error('Test setup error: trace should not be active');
  }
  
  try {
    await endTrace();
    throw new Error('Expected error when ending trace without starting one');
  } catch (error) {
    if (error instanceof Error && !error.message.includes('No active trace')) {
      throw error;
    }
  }
})();

await test('Database offline fallback', async () => {
  const originalInsertTrace = insertTrace;
  
  const trace: HarnessTrace = {
    trace_id: 'test_offline',
    session_id: 'sess_offline',
    user_id: 'user_offline',
    started_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    events: [
      {
        span_id: 'span_1',
        parent_id: null,
        event_type: 'USER_INPUT',
        timestamp: new Date().toISOString(),
        inputs: { message: 'test' },
        outputs: { received: true },
        metadata: {},
      },
    ],
    summary: {
      total_events: 1,
      total_duration_ms: 100,
      total_tokens: 50,
      total_cost_usd: 0.001,
      agents_used: [],
      modes_used: [],
      errors: 0,
    },
  };
  
  await insertTrace(trace);
})();

await test('Deeply nested spans (10+ levels)', async () => {
  const trace = startTrace('sess_deep', 'user_deep');
  
  const spans: string[] = [];
  for (let i = 0; i < 15; i++) {
    const span = startSpan('AGENT_ROUTING', { level: i });
    spans.push(span);
  }
  
  for (let i = spans.length - 1; i >= 0; i--) {
    endSpan(spans[i], { level: i }, { duration_ms: 10 });
  }
  
  const finalTrace = await endTrace();
  
  if (finalTrace.events.length === 0) {
    throw new Error('Expected nested events to be created');
  }
  
  let depth = 0;
  let current = finalTrace.events[0];
  while (current.children && current.children.length > 0) {
    depth++;
    current = current.children[0];
  }
  
  if (depth !== 14) {
    throw new Error(`Expected depth of 14, got ${depth}`);
  }
})();

await test('Trace with all event types', async () => {
  const trace = startTrace('sess_all_types', 'user_all_types');
  
  const eventTypes = [
    'SESSION_START',
    'SESSION_END',
    'MODE_TRANSITION',
    'AGENT_ROUTING',
    'AGENT_HANDOFF',
    'TOOL_INVOCATION',
    'PERSPECTIVE_INTEGRATION',
    'COST_TRACKED',
    'ERROR',
    'USER_INPUT',
    'AGENT_RESPONSE',
  ] as const;
  
  for (const eventType of eventTypes) {
    logEvent(eventType, { type: eventType }, { success: true }, { duration_ms: 10 });
  }
  
  const finalTrace = await endTrace();
  
  if (finalTrace.summary.total_events !== eventTypes.length) {
    throw new Error(`Expected ${eventTypes.length} events, got ${finalTrace.summary.total_events}`);
  }
})();

await test('Summary metrics calculation', async () => {
  const trace = startTrace('sess_metrics', 'user_metrics');
  
  logEvent('USER_INPUT', {}, {}, { 
    duration_ms: 100, 
    token_count: 50, 
    cost_usd: 0.01 
  });
  
  logEvent('AGENT_ROUTING', {}, {}, { 
    duration_ms: 200, 
    token_count: 100, 
    cost_usd: 0.02,
    agent_id: 'dojo'
  });
  
  logEvent('MODE_TRANSITION', {}, {}, { 
    mode: 'Mirror' 
  });
  
  logEvent('ERROR', {}, {}, {});
  
  const finalTrace = await endTrace();
  
  if (finalTrace.summary.total_duration_ms !== 300) {
    throw new Error(`Expected duration 300ms, got ${finalTrace.summary.total_duration_ms}ms`);
  }
  if (finalTrace.summary.total_tokens !== 150) {
    throw new Error(`Expected 150 tokens, got ${finalTrace.summary.total_tokens}`);
  }
  if (finalTrace.summary.total_cost_usd !== 0.03) {
    throw new Error(`Expected $0.03, got $${finalTrace.summary.total_cost_usd}`);
  }
  if (finalTrace.summary.errors !== 1) {
    throw new Error(`Expected 1 error, got ${finalTrace.summary.errors}`);
  }
  if (finalTrace.summary.agents_used.length !== 1 || finalTrace.summary.agents_used[0] !== 'dojo') {
    throw new Error(`Expected agents_used ['dojo'], got ${JSON.stringify(finalTrace.summary.agents_used)}`);
  }
  if (finalTrace.summary.modes_used.length !== 1 || finalTrace.summary.modes_used[0] !== 'Mirror') {
    throw new Error(`Expected modes_used ['Mirror'], got ${JSON.stringify(finalTrace.summary.modes_used)}`);
  }
})();

  console.log('\n' + '='.repeat(50));
  console.log('Test Results');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`\nTotal: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✓ All tests passed!');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
