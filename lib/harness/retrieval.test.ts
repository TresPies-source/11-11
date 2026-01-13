import { startTrace, logEvent, endTrace } from './trace';
import { getTrace, getSessionTraces, getUserTraces } from './retrieval';
import { getDB } from '../pglite/client';

(async () => {
  console.log('Testing Harness Trace Retrieval API...\n');

  const sessionId = 'test_session_retrieval';
  const userId = 'test_user_retrieval';
  let testTraceId: string;

  const db = await getDB();
  await db.query('DELETE FROM harness_traces WHERE user_id = $1', [userId]);

  console.log('1. Testing getTrace() - retrieve by ID...');
  try {
    startTrace(sessionId, userId);
    logEvent('USER_INPUT', { message: 'Hello' }, { received: true });
    const endedTrace = await endTrace();
    testTraceId = endedTrace.trace_id;

    await new Promise((resolve) => setTimeout(resolve, 100));

    const retrieved = await getTrace(testTraceId);

    if (!retrieved) {
      throw new Error('Retrieved trace should not be null');
    }
    if (retrieved.trace_id !== testTraceId) {
      throw new Error('Trace ID mismatch');
    }
    if (retrieved.session_id !== sessionId) {
      throw new Error('Session ID mismatch');
    }
    if (retrieved.user_id !== userId) {
      throw new Error('User ID mismatch');
    }
    if (retrieved.events.length !== 1) {
      throw new Error('Should have 1 event');
    }
    if (retrieved.events[0].event_type !== 'USER_INPUT') {
      throw new Error('Event type mismatch');
    }

    console.log('✓ Trace retrieved successfully');
    console.log(`  - Trace ID: ${retrieved.trace_id}`);
    console.log(`  - Events: ${retrieved.events.length}`);
  } catch (error) {
    console.error('✗ Failed to retrieve trace:', error);
    process.exit(1);
  }

  console.log('\n2. Testing getTrace() - non-existent trace...');
  try {
    const retrieved = await getTrace('non_existent_trace');

    if (retrieved !== null) {
      throw new Error('Should return null for non-existent trace');
    }

    console.log('✓ Returns null for non-existent trace');
  } catch (error) {
    console.error('✗ Failed non-existent trace test:', error);
    process.exit(1);
  }

  console.log('\n3. Testing getTrace() - invalid input validation...');
  try {
    let errorThrown = false;
    try {
      await getTrace('');
    } catch (e: any) {
      if (e.message.includes('Invalid trace_id')) {
        errorThrown = true;
      }
    }
    if (!errorThrown) {
      throw new Error('Should throw error for empty trace_id');
    }

    console.log('✓ Input validation works correctly');
  } catch (error) {
    console.error('✗ Failed input validation test:', error);
    process.exit(1);
  }

  console.log('\n4. Testing getSessionTraces() - retrieve all traces for session...');
  try {
    const session2 = sessionId + '_multi';
    
    startTrace(session2, userId);
    logEvent('USER_INPUT', { message: 'First' }, { received: true });
    await endTrace();

    await new Promise((resolve) => setTimeout(resolve, 100));

    startTrace(session2, userId);
    logEvent('USER_INPUT', { message: 'Second' }, { received: true });
    await endTrace();

    await new Promise((resolve) => setTimeout(resolve, 100));

    const traces = await getSessionTraces(session2);

    if (traces.length !== 2) {
      throw new Error(`Expected 2 traces, got ${traces.length}`);
    }
    if (traces[0].session_id !== session2) {
      throw new Error('Session ID mismatch for first trace');
    }
    if (traces[1].session_id !== session2) {
      throw new Error('Session ID mismatch for second trace');
    }

    console.log('✓ Retrieved session traces successfully');
    console.log(`  - Traces found: ${traces.length}`);
  } catch (error) {
    console.error('✗ Failed to retrieve session traces:', error);
    process.exit(1);
  }

  console.log('\n5. Testing getSessionTraces() - non-existent session...');
  try {
    const traces = await getSessionTraces('non_existent_session_12345');

    if (traces.length !== 0) {
      throw new Error('Should return empty array for non-existent session');
    }

    console.log('✓ Returns empty array for non-existent session');
  } catch (error) {
    console.error('✗ Failed non-existent session test:', error);
    process.exit(1);
  }

  console.log('\n6. Testing getUserTraces() - retrieve user traces...');
  try {
    const traces = await getUserTraces(userId);

    if (traces.length < 3) {
      throw new Error(`Expected at least 3 traces, got ${traces.length}`);
    }
    
    const allSameUser = traces.every((t) => t.user_id === userId);
    if (!allSameUser) {
      throw new Error('Not all traces belong to the user');
    }

    console.log('✓ Retrieved user traces successfully');
    console.log(`  - Traces found: ${traces.length}`);
  } catch (error) {
    console.error('✗ Failed to retrieve user traces:', error);
    process.exit(1);
  }

  console.log('\n7. Testing getUserTraces() - limit parameter...');
  try {
    for (let i = 0; i < 5; i++) {
      startTrace(sessionId + `_limit_${i}`, userId);
      logEvent('USER_INPUT', { message: `Message ${i}` }, { received: true });
      await endTrace();
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const traces = await getUserTraces(userId, 3);
    
    if (traces.length > 3) {
      throw new Error(`Expected max 3 traces, got ${traces.length}`);
    }

    console.log('✓ Limit parameter works correctly');
    console.log(`  - Traces returned: ${traces.length}`);
  } catch (error) {
    console.error('✗ Failed limit parameter test:', error);
    process.exit(1);
  }

  console.log('\n8. Testing getUserTraces() - descending order...');
  try {
    const traces = await getUserTraces(userId);

    if (traces.length > 1) {
      for (let i = 0; i < traces.length - 1; i++) {
        const current = new Date(traces[i].started_at);
        const next = new Date(traces[i + 1].started_at);
        if (current.getTime() < next.getTime()) {
          throw new Error('Traces not in descending order by started_at');
        }
      }
    }

    console.log('✓ Traces returned in descending order');
  } catch (error) {
    console.error('✗ Failed descending order test:', error);
    process.exit(1);
  }

  console.log('\n9. Testing getUserTraces() - input validation...');
  try {
    let errorThrown = false;
    try {
      await getUserTraces('');
    } catch (e: any) {
      if (e.message.includes('Invalid user_id')) {
        errorThrown = true;
      }
    }
    if (!errorThrown) {
      throw new Error('Should throw error for empty user_id');
    }

    errorThrown = false;
    try {
      await getUserTraces(userId, 0);
    } catch (e: any) {
      if (e.message.includes('Invalid limit')) {
        errorThrown = true;
      }
    }
    if (!errorThrown) {
      throw new Error('Should throw error for limit = 0');
    }

    errorThrown = false;
    try {
      await getUserTraces(userId, 101);
    } catch (e: any) {
      if (e.message.includes('Invalid limit')) {
        errorThrown = true;
      }
    }
    if (!errorThrown) {
      throw new Error('Should throw error for limit > 100');
    }

    console.log('✓ Input validation works correctly');
  } catch (error) {
    console.error('✗ Failed input validation test:', error);
    process.exit(1);
  }

  await db.query('DELETE FROM harness_traces WHERE user_id = $1', [userId]);

  console.log('\n✓ All Harness Trace Retrieval tests passed!\n');
})().catch((error) => {
  console.error('Fatal test error:', error);
  process.exit(1);
});
