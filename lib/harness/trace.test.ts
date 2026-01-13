import {
  startTrace,
  logEvent,
  startSpan,
  endSpan,
  endTrace,
  getCurrentTrace,
  isTraceActive,
} from './trace';

(async () => {
console.log('Testing Harness Trace API...\n');

console.log('1. Testing startTrace()...');
try {
  const trace = startTrace('test_session_123', 'test_user_456');
  
  if (!trace.trace_id.startsWith('trace_')) {
    throw new Error('Trace ID does not have correct prefix');
  }
  if (trace.session_id !== 'test_session_123') {
    throw new Error('Session ID mismatch');
  }
  if (trace.user_id !== 'test_user_456') {
    throw new Error('User ID mismatch');
  }
  if (trace.ended_at !== null) {
    throw new Error('Trace should not be ended yet');
  }
  if (trace.events.length !== 0) {
    throw new Error('Trace should start with no events');
  }
  if (!isTraceActive()) {
    throw new Error('Trace should be active');
  }
  
  console.log('✓ Trace started successfully');
  console.log(`  - Trace ID: ${trace.trace_id}`);
  console.log(`  - Session ID: ${trace.session_id}`);
  console.log(`  - User ID: ${trace.user_id}`);
} catch (error) {
  console.error('✗ Failed to start trace:', error);
  process.exit(1);
}

console.log('\n2. Testing logEvent()...');
try {
  const spanId = logEvent(
    'USER_INPUT',
    { message: 'Test query' },
    { received: true },
    { duration_ms: 10 }
  );
  
  if (!spanId.startsWith('span_')) {
    throw new Error('Span ID does not have correct prefix');
  }
  
  const trace = getCurrentTrace();
  if (!trace || trace.events.length !== 1) {
    throw new Error('Event was not added to trace');
  }
  
  const event = trace.events[0];
  if (event.event_type !== 'USER_INPUT') {
    throw new Error('Event type mismatch');
  }
  if (event.inputs.message !== 'Test query') {
    throw new Error('Event inputs mismatch');
  }
  if (event.outputs.received !== true) {
    throw new Error('Event outputs mismatch');
  }
  if (event.metadata.duration_ms !== 10) {
    throw new Error('Event metadata mismatch');
  }
  
  console.log('✓ Event logged successfully');
  console.log(`  - Span ID: ${spanId}`);
  console.log(`  - Event type: ${event.event_type}`);
} catch (error) {
  console.error('✗ Failed to log event:', error);
  process.exit(1);
}

console.log('\n3. Testing startSpan() and endSpan()...');
try {
  const routingSpan = startSpan('AGENT_ROUTING', { query: 'Test routing query' });
  
  if (!routingSpan.startsWith('span_')) {
    throw new Error('Span ID does not have correct prefix');
  }
  
  endSpan(routingSpan, { agent_id: 'dojo', confidence: 0.95 }, { duration_ms: 150 });
  
  const trace = getCurrentTrace();
  if (!trace || trace.events.length !== 2) {
    throw new Error('Span was not added to trace');
  }
  
  const spanEvent = trace.events[1];
  if (spanEvent.event_type !== 'AGENT_ROUTING') {
    throw new Error('Span event type mismatch');
  }
  if (spanEvent.outputs.agent_id !== 'dojo') {
    throw new Error('Span outputs not updated');
  }
  if (spanEvent.metadata.duration_ms !== 150) {
    throw new Error('Span metadata not updated');
  }
  
  console.log('✓ Span started and ended successfully');
  console.log(`  - Span ID: ${routingSpan}`);
  console.log(`  - Event type: ${spanEvent.event_type}`);
} catch (error) {
  console.error('✗ Failed to start/end span:', error);
  process.exit(1);
}

console.log('\n4. Testing nested spans...');
try {
  const parentSpan = startSpan('TOOL_INVOCATION', { tool: 'search' });
  const childSpan = startSpan('AGENT_ROUTING', { query: 'Nested query' });
  
  endSpan(childSpan, { result: 'nested result' }, { duration_ms: 50 });
  endSpan(parentSpan, { result: 'parent result' }, { duration_ms: 100 });
  
  const trace = getCurrentTrace();
  if (!trace) {
    throw new Error('Trace is null');
  }
  
  const parentEvent = trace.events[2];
  if (!parentEvent.children || parentEvent.children.length !== 1) {
    throw new Error('Parent event should have one child');
  }
  
  const childEvent = parentEvent.children[0];
  if (childEvent.parent_id !== parentSpan) {
    throw new Error('Child parent_id mismatch');
  }
  if (childEvent.outputs.result !== 'nested result') {
    throw new Error('Child outputs not updated');
  }
  
  console.log('✓ Nested spans work correctly');
  console.log(`  - Parent span ID: ${parentSpan}`);
  console.log(`  - Child span ID: ${childSpan}`);
  console.log(`  - Child has correct parent_id: ${childEvent.parent_id === parentSpan}`);
} catch (error) {
  console.error('✗ Failed nested spans:', error);
  process.exit(1);
}

console.log('\n5. Testing summary updates...');
try {
  const trace = getCurrentTrace();
  if (!trace) {
    throw new Error('Trace is null');
  }
  
  if (trace.summary.total_duration_ms === 0) {
    throw new Error('Summary duration should be updated');
  }
  
  console.log('✓ Summary updates correctly');
  console.log(`  - Total duration: ${trace.summary.total_duration_ms}ms`);
  console.log(`  - Total events (computed): ${trace.summary.total_events}`);
} catch (error) {
  console.error('✗ Failed summary updates:', error);
  process.exit(1);
}

console.log('\n6. Testing endTrace()...');
try {
  const finalTrace = await endTrace();
  
  if (!finalTrace.ended_at) {
    throw new Error('Trace should have ended_at timestamp');
  }
  if (finalTrace.summary.total_events === 0) {
    throw new Error('Summary should have total_events count');
  }
  if (isTraceActive()) {
    throw new Error('Trace should not be active after ending');
  }
  if (getCurrentTrace() !== null) {
    throw new Error('Current trace should be null after ending');
  }
  
  console.log('✓ Trace ended successfully');
  console.log(`  - Total events: ${finalTrace.summary.total_events}`);
  console.log(`  - Total duration: ${finalTrace.summary.total_duration_ms}ms`);
  console.log(`  - Started at: ${finalTrace.started_at}`);
  console.log(`  - Ended at: ${finalTrace.ended_at}`);
} catch (error) {
  console.error('✗ Failed to end trace:', error);
  process.exit(1);
}

console.log('\n7. Testing error event tracking...');
try {
  startTrace('error_test_session', 'test_user');
  
  logEvent('ERROR', { context: 'test error' }, {}, { error_message: 'Test error' });
  
  const trace = getCurrentTrace();
  if (!trace || trace.summary.errors !== 1) {
    throw new Error('Error count not updated');
  }
  
  await endTrace();
  
  console.log('✓ Error tracking works correctly');
} catch (error) {
  console.error('✗ Failed error tracking:', error);
  process.exit(1);
}

console.log('\n8. Testing agent and mode tracking...');
try {
  startTrace('tracking_test_session', 'test_user');
  
  logEvent('AGENT_ROUTING', {}, {}, { agent_id: 'dojo' });
  logEvent('AGENT_ROUTING', {}, {}, { agent_id: 'librarian' });
  logEvent('AGENT_ROUTING', {}, {}, { agent_id: 'dojo' });
  logEvent('MODE_TRANSITION', {}, {}, { mode: 'Mirror' });
  logEvent('MODE_TRANSITION', {}, {}, { mode: 'Scout' });
  
  const trace = getCurrentTrace();
  if (!trace) {
    throw new Error('Trace is null');
  }
  
  if (trace.summary.agents_used.length !== 2) {
    throw new Error('Should have 2 unique agents');
  }
  if (!trace.summary.agents_used.includes('dojo') || !trace.summary.agents_used.includes('librarian')) {
    throw new Error('Agent tracking incorrect');
  }
  if (trace.summary.modes_used.length !== 2) {
    throw new Error('Should have 2 unique modes');
  }
  if (!trace.summary.modes_used.includes('Mirror') || !trace.summary.modes_used.includes('Scout')) {
    throw new Error('Mode tracking incorrect');
  }
  
  await endTrace();
  
  console.log('✓ Agent and mode tracking works correctly');
  console.log(`  - Agents used: ${trace.summary.agents_used.join(', ')}`);
  console.log(`  - Modes used: ${trace.summary.modes_used.join(', ')}`);
} catch (error) {
  console.error('✗ Failed agent/mode tracking:', error);
  process.exit(1);
}

console.log('\n✓ All Harness Trace tests passed!\n');
})().catch((error) => {
  console.error('Fatal test error:', error);
  process.exit(1);
});
