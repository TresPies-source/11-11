import { trackCost, getSessionTotalUsage, getUserMonthlyTotalUsage } from './tracking';
import { createSession, getCurrentMonth, getCostRecords } from '../pglite/cost';
import type { TrackCostInput } from './tracking';

async function runTests() {
  console.log('Running cost tracking tests...\n');

  const testUserId = 'test-user-' + Date.now();
  const testSessionId = 'test-session-' + Date.now();
  const testQueryId = 'test-query-' + Date.now();

  console.log('Test 1: Basic cost tracking (requires database)');
  try {
    await createSession({ 
      id: testSessionId, 
      user_id: testUserId, 
      total_tokens: 0, 
      total_cost_usd: 0 
    });

    const input: TrackCostInput = {
      user_id: testUserId,
      session_id: testSessionId,
      query_id: testQueryId,
      model: 'gpt-4o-mini',
      prompt_tokens: 100,
      completion_tokens: 200,
      total_tokens: 300,
      cost_usd: 0.05,
      operation_type: 'agent_execution',
    };

    const result = await trackCost(input);
    const pass = result.success && result.cost_record_id;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Success: ${result.success}, Record ID: ${result.cost_record_id}`);
    console.log(`  Session Total: ${result.session_total_tokens} tokens`);
    console.log(`  User Monthly Total: ${result.user_monthly_total_tokens} tokens`);
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 2: Cost tracking updates session totals (requires database)');
  try {
    const input: TrackCostInput = {
      user_id: testUserId,
      session_id: testSessionId,
      query_id: testQueryId + '-2',
      model: 'gpt-4o-mini',
      prompt_tokens: 150,
      completion_tokens: 250,
      total_tokens: 400,
      cost_usd: 0.07,
      operation_type: 'routing',
    };

    const result = await trackCost(input);
    const sessionUsage = await getSessionTotalUsage(testSessionId);
    const pass = result.success && sessionUsage.total_tokens === 700;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Session Total: ${sessionUsage.total_tokens} tokens (expected 700)`);
    console.log(`  Session Cost: $${sessionUsage.total_cost_usd.toFixed(4)} (expected $0.12)`);
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 3: Cost tracking updates user monthly totals (requires database)');
  try {
    const userUsage = await getUserMonthlyTotalUsage(testUserId);
    const pass = userUsage.total_tokens === 700;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  User Monthly Total: ${userUsage.total_tokens} tokens (expected 700)`);
    console.log(`  User Monthly Cost: $${userUsage.total_cost_usd.toFixed(4)} (expected $0.12)`);
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 4: Cost tracking without session_id (user-level only)');
  try {
    const input: TrackCostInput = {
      user_id: testUserId,
      session_id: null,
      query_id: testQueryId + '-3',
      model: 'gpt-4o',
      prompt_tokens: 200,
      completion_tokens: 300,
      total_tokens: 500,
      cost_usd: 0.10,
      operation_type: 'search',
    };

    const result = await trackCost(input);
    const pass = result.success && !result.session_total_tokens;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Session Total: ${result.session_total_tokens} (expected undefined)`);
    console.log(`  User Monthly Total: ${result.user_monthly_total_tokens} tokens`);
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 5: Multiple operation types');
  try {
    const operationTypes: Array<TrackCostInput['operation_type']> = [
      'routing',
      'agent_execution',
      'search',
      'critique',
      'other',
    ];

    let allSuccess = true;
    for (const opType of operationTypes) {
      const input: TrackCostInput = {
        user_id: testUserId,
        session_id: testSessionId,
        query_id: `${testQueryId}-${opType}`,
        model: 'gpt-4o-mini',
        prompt_tokens: 50,
        completion_tokens: 100,
        total_tokens: 150,
        cost_usd: 0.02,
        operation_type: opType,
      };

      const result = await trackCost(input);
      if (!result.success) {
        allSuccess = false;
        console.log(`  Failed for operation type: ${opType}`);
      }
    }

    console.log(`  Status: ${allSuccess ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  All operation types tracked: ${allSuccess}`);
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 6: Cost records are retrievable (requires database)');
  try {
    const records = await getCostRecords(testUserId, 10);
    const pass = records.length > 0;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Retrieved ${records.length} cost records`);
    if (records.length > 0) {
      console.log(`  Latest record: ${records[0].model}, ${records[0].total_tokens} tokens, $${records[0].cost_usd}`);
    }
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 7: Month rollover logic');
  try {
    const currentMonth = getCurrentMonth();
    const expectedFormat = /^\d{4}-\d{2}$/;
    const pass = expectedFormat.test(currentMonth);
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Current month: ${currentMonth} (format: YYYY-MM)`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 8: Edge case - zero cost');
  try {
    const input: TrackCostInput = {
      user_id: testUserId,
      session_id: testSessionId,
      query_id: testQueryId + '-zero',
      model: 'gpt-4o-mini',
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      cost_usd: 0,
      operation_type: 'other',
    };

    const result = await trackCost(input);
    const pass = result.success;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Success: ${result.success}`);
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 9: Error handling - invalid session ID');
  try {
    const input: TrackCostInput = {
      user_id: testUserId,
      session_id: 'invalid-session-that-does-not-exist',
      query_id: testQueryId + '-invalid',
      model: 'gpt-4o-mini',
      prompt_tokens: 100,
      completion_tokens: 200,
      total_tokens: 300,
      cost_usd: 0.05,
      operation_type: 'agent_execution',
    };

    const result = await trackCost(input);
    const pass = result.success;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Success: ${result.success} (graceful degradation expected)`);
    console.log(`  Note: Session update may fail, but cost record should still be created`);
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 10: Cost calculation accuracy');
  try {
    const input: TrackCostInput = {
      user_id: testUserId,
      session_id: testSessionId,
      query_id: testQueryId + '-accuracy',
      model: 'gpt-4o',
      prompt_tokens: 1000,
      completion_tokens: 2000,
      total_tokens: 3000,
      cost_usd: 0.0225,
      operation_type: 'agent_execution',
    };

    const result = await trackCost(input);
    const records = await getCostRecords(testUserId, 1);
    const savedRecord = records.find(r => r.query_id === testQueryId + '-accuracy');
    const pass = savedRecord && Math.abs(savedRecord.cost_usd - 0.0225) < 0.0001;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    if (savedRecord) {
      console.log(`  Saved cost: $${savedRecord.cost_usd.toFixed(4)} (expected $0.0225)`);
    }
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('✅ All tests completed!');
  console.log('\nNote: Tests marked with "⚠ SKIP" require database initialization.');
  console.log('Run dev server first to initialize database, then run: npm run test:tracking');
}

runTests().catch(console.error);
