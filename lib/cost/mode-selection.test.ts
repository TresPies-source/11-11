import { selectMode, getRecommendedMode } from './mode-selection';
import { createSession, upsertUserMonthlyUsage, getCurrentMonth } from '../pglite/cost';
import { DEFAULT_BUDGET } from './constants';

/**
 * Manual test suite for mode selection functionality.
 * Run with: node --loader tsx lib/cost/mode-selection.test.ts
 */

async function runTests() {
  console.log('Running mode selection tests...\n');

  const testUserId = 'test-user-' + Date.now();
  const testSessionId1 = 'test-session-' + Date.now();
  const testSessionId2 = 'test-session-' + (Date.now() + 1);

  // Test 1: High budget (>40%)
  console.log('Test 1: Allow requested mode when budget is high (>40%)');
  try {
    // Create fresh session with low usage (20% = 10,000 tokens)
    await createSession({ id: testSessionId1, user_id: testUserId, total_tokens: 10000, total_cost_usd: 0.025 });
    // Create user monthly usage (20% = 100,000 tokens)
    await upsertUserMonthlyUsage(testUserId, getCurrentMonth(), 100000, 2.50);

    const result = await selectMode(testUserId, testSessionId1, 'Implementation');
    
    const pass = result.mode === 'Implementation' && 
                 result.model === 'gpt-4o' && 
                 !result.downgraded &&
                 result.reason.includes('Budget sufficient');
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Mode: ${result.mode}, Model: ${result.model}, Downgraded: ${result.downgraded}`);
    console.log(`  Reason: ${result.reason}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  // Test 2: Moderate budget (20-40%)
  console.log('Test 2: Downgrade when budget is moderate (20-40%)');
  try {
    const testSessionId = 'test-session-moderate-' + Date.now();
    // Create session with 70% usage (35,000 tokens out of 50,000)
    await createSession({ id: testSessionId, user_id: testUserId, total_tokens: 35000, total_cost_usd: 0.875 });

    const result = await selectMode(testUserId, testSessionId, 'Implementation');
    
    const pass = result.mode === 'Mirror' && 
                 result.model === 'gpt-4o-mini' && 
                 result.downgraded &&
                 result.reason.includes('Budget moderate');
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Mode: ${result.mode}, Model: ${result.model}, Downgraded: ${result.downgraded}`);
    console.log(`  Reason: ${result.reason}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  // Test 3: Critical budget (<20%)
  console.log('Test 3: Force Mirror when budget is critically low (<20%)');
  try {
    const testSessionId = 'test-session-critical-' + Date.now();
    // Create session with 90% usage (45,000 tokens out of 50,000)
    await createSession({ id: testSessionId, user_id: testUserId, total_tokens: 45000, total_cost_usd: 1.125 });

    const result = await selectMode(testUserId, testSessionId, 'Implementation');
    
    const pass = result.mode === 'Mirror' && 
                 result.model === 'gpt-4o-mini' && 
                 result.downgraded &&
                 result.reason.includes('Budget critically low');
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Mode: ${result.mode}, Model: ${result.model}, Downgraded: ${result.downgraded}`);
    console.log(`  Reason: ${result.reason}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  // Test 4: Null session ID
  console.log('Test 4: Handle null sessionId gracefully');
  try {
    const testUserFresh = 'test-user-fresh-' + Date.now();
    // Create user with low usage
    await upsertUserMonthlyUsage(testUserFresh, getCurrentMonth(), 50000, 1.25);

    const result = await selectMode(testUserFresh, null, 'Gardener');
    
    const pass = result.mode === 'Gardener' && 
                 result.model === 'gpt-4o' && 
                 !result.downgraded;
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Mode: ${result.mode}, Model: ${result.model}, Downgraded: ${result.downgraded}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  // Test 5: getRecommendedMode with excellent budget
  console.log('Test 5: Recommend Implementation when budget excellent (>70%)');
  try {
    const testUserExcellent = 'test-user-excellent-' + Date.now();
    await upsertUserMonthlyUsage(testUserExcellent, getCurrentMonth(), 50000, 1.25);
    const testSessionExcellent = 'test-session-excellent-' + Date.now();
    await createSession({ id: testSessionExcellent, user_id: testUserExcellent, total_tokens: 5000, total_cost_usd: 0.0125 });

    const result = await getRecommendedMode(testUserExcellent, testSessionExcellent);
    
    const pass = result.mode === 'Implementation' && 
                 result.model === 'gpt-4o' &&
                 result.reason.includes('Budget excellent');
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Recommended Mode: ${result.mode}, Model: ${result.model}`);
    console.log(`  Reason: ${result.reason}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  // Test 6: getRecommendedMode with moderate budget
  console.log('Test 6: Recommend Scout when budget moderate (20-40%)');
  try {
    const testUserModerate = 'test-user-moderate-' + Date.now();
    await upsertUserMonthlyUsage(testUserModerate, getCurrentMonth(), 100000, 2.50);
    const testSessionModerate = 'test-session-moderate2-' + Date.now();
    await createSession({ id: testSessionModerate, user_id: testUserModerate, total_tokens: 35000, total_cost_usd: 0.875 });

    const result = await getRecommendedMode(testUserModerate, testSessionModerate);
    
    const pass = result.mode === 'Scout' && 
                 result.model === 'gpt-4o-mini' &&
                 result.reason.includes('Budget moderate');
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Recommended Mode: ${result.mode}, Model: ${result.model}`);
    console.log(`  Reason: ${result.reason}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Mode selection tests complete!');
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}
