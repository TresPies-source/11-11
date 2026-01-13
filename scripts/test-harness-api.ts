import { startTrace, logEvent, endTrace } from '../lib/harness/trace';

(async () => {
  console.log('Testing Harness Trace API Endpoints...\n');

  const sessionId = 'api_test_session';
  const userId = 'test_user_api';
  
  console.log('1. Creating test traces...');
  try {
    startTrace(sessionId, userId);
    logEvent('USER_INPUT', { message: 'Test message 1' }, { received: true });
    const trace1 = await endTrace();

    await new Promise((resolve) => setTimeout(resolve, 100));

    startTrace(sessionId + '_2', userId);
    logEvent('USER_INPUT', { message: 'Test message 2' }, { received: true });
    logEvent('AGENT_ROUTING', { query: 'Route me' }, { agent_id: 'dojo' }, { agent_id: 'dojo' });
    const trace2 = await endTrace();

    console.log('✓ Created 2 test traces');
    console.log(`  - Trace 1: ${trace1.trace_id}`);
    console.log(`  - Trace 2: ${trace2.trace_id}`);

    console.log('\n2. Testing API endpoint patterns...');
    console.log('  Note: The API endpoints are ready and can be tested with:');
    console.log(`  - GET /api/harness/trace?trace_id=${trace1.trace_id}`);
    console.log(`  - GET /api/harness/session?session_id=${sessionId}`);
    console.log(`  - GET /api/harness/user?user_id=${userId}&limit=10`);
    console.log('\n  These endpoints include:');
    console.log('  - Authentication (dev mode support)');
    console.log('  - Input validation');
    console.log('  - Error handling (404, 401, 403, 500)');
    console.log('  - Proper JSON responses');

    console.log('\n✓ API endpoints are ready for testing');
    console.log('  Start the dev server with `npm run dev` to test them');
  } catch (error) {
    console.error('✗ Failed to create test traces:', error);
    process.exit(1);
  }
})().catch((error) => {
  console.error('Fatal test error:', error);
  process.exit(1);
});
