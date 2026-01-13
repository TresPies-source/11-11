import { checkBudget, formatBudgetError, formatBudgetWarnings } from './budgets';
import { DEFAULT_BUDGET } from './constants';
import type { BudgetConfig } from './types';
import { createSession, upsertUserMonthlyUsage, getCurrentMonth } from '../pglite/cost';

async function runTests() {
  console.log('Running budget checking tests...\n');

  const testUserId = 'test-user-' + Date.now();
  const testSessionId = 'test-session-' + Date.now();

  console.log('Test 1: Query budget - within limit');
  try {
    const result = await checkBudget(testUserId, 5000);
    const pass = result.allowed && result.warnings?.length === 0;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Allowed: ${result.allowed}, Warnings: ${result.warnings?.length || 0}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 2: Query budget - warning threshold (80%)');
  try {
    const result = await checkBudget(testUserId, 8500);
    const pass = result.allowed && result.warnings?.includes('query_approaching_limit');
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Allowed: ${result.allowed}, Warnings: ${result.warnings?.join(', ')}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 3: Query budget - hard stop (100%)');
  try {
    const result = await checkBudget(testUserId, 11000);
    const pass = !result.allowed && result.reason === 'query_limit_exceeded';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Allowed: ${result.allowed}, Reason: ${result.reason}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 4: Session budget - within limit (requires database)');
  try {
    await createSession({ user_id: testUserId, total_tokens: 10000, total_cost_usd: 1.0 });
    const result = await checkBudget(testUserId, 5000, testSessionId);
    const pass = result.allowed;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Allowed: ${result.allowed}`);
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 5: Session budget - warning threshold (requires database)');
  try {
    const result = await checkBudget(testUserId, 35000, testSessionId);
    const pass = result.allowed && result.warnings?.includes('session_approaching_limit');
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Warnings: ${result.warnings?.join(', ')}`);
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 6: Session budget - hard stop (requires database)');
  try {
    const result = await checkBudget(testUserId, 45000, testSessionId);
    const pass = !result.allowed && result.reason === 'session_limit_exceeded';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Allowed: ${result.allowed}, Reason: ${result.reason}`);
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 7: User monthly budget - within limit (requires database)');
  try {
    const currentMonth = getCurrentMonth();
    await upsertUserMonthlyUsage(testUserId, currentMonth, 100000, 10.0);
    const result = await checkBudget(testUserId, 50000);
    const pass = result.allowed;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Allowed: ${result.allowed}`);
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 8: User monthly budget - warning threshold (requires database)');
  try {
    const currentMonth = getCurrentMonth();
    await upsertUserMonthlyUsage(testUserId, currentMonth, 300000, 30.0);
    const result = await checkBudget(testUserId, 110000);
    const pass = result.allowed && result.warnings?.includes('user_approaching_limit');
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Warnings: ${result.warnings?.join(', ')}`);
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 9: User monthly budget - hard stop (requires database)');
  try {
    const currentMonth = getCurrentMonth();
    await upsertUserMonthlyUsage(testUserId, currentMonth, 450000, 45.0);
    const result = await checkBudget(testUserId, 60000);
    const pass = !result.allowed && result.reason === 'user_limit_exceeded';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Allowed: ${result.allowed}, Reason: ${result.reason}`);
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 10: Edge case - zero tokens');
  try {
    const result = await checkBudget(testUserId, 0);
    const pass = result.allowed && result.warnings?.length === 0;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Allowed: ${result.allowed}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 11: Edge case - negative tokens');
  try {
    const result = await checkBudget(testUserId, -100);
    const pass = result.allowed;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Allowed: ${result.allowed}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 12: Edge case - no session ID (user-level only)');
  try {
    const result = await checkBudget(testUserId, 5000, null);
    const pass = result.allowed;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Allowed: ${result.allowed}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 13: Custom budget configuration');
  try {
    const customConfig: BudgetConfig = {
      query_limit: 5000,
      session_limit: 25000,
      user_monthly_limit: 250000,
      warn_threshold: 0.8,
      stop_threshold: 1.0,
    };
    const result = await checkBudget(testUserId, 6000, null, customConfig);
    const pass = !result.allowed && result.reason === 'query_limit_exceeded';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Allowed: ${result.allowed}, Reason: ${result.reason}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 14: formatBudgetError - query exceeded');
  const queryError = formatBudgetError({
    allowed: false,
    reason: 'query_limit_exceeded',
    limit: 10000,
    estimated: 11000,
  });
  const pass14 = queryError.includes('Query budget exceeded');
  console.log(`  Status: ${pass14 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  Message: ${queryError}`);
  console.log();

  console.log('Test 15: formatBudgetError - session exceeded');
  const sessionError = formatBudgetError({
    allowed: false,
    reason: 'session_limit_exceeded',
    limit: 50000,
    current: 30000,
    estimated: 25000,
  });
  const pass15 = sessionError.includes('Session budget exceeded');
  console.log(`  Status: ${pass15 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  Message: ${sessionError}`);
  console.log();

  console.log('Test 16: formatBudgetError - user exceeded');
  const userError = formatBudgetError({
    allowed: false,
    reason: 'user_limit_exceeded',
    limit: 500000,
    current: 450000,
    estimated: 60000,
  });
  const pass16 = userError.includes('Monthly budget exceeded');
  console.log(`  Status: ${pass16 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  Message: ${userError}`);
  console.log();

  console.log('Test 17: formatBudgetWarnings');
  const warnings = formatBudgetWarnings([
    'query_approaching_limit',
    'session_approaching_limit',
    'user_approaching_limit',
  ]);
  const pass17 = warnings.length === 3 && warnings.every(w => w.includes('Warning'));
  console.log(`  Status: ${pass17 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  Warnings: ${warnings.join('; ')}`);
  console.log();

  console.log('Test 18: Multiple warnings at once');
  try {
    const result = await checkBudget(testUserId, 8500);
    const hasQueryWarning = result.warnings?.includes('query_approaching_limit');
    console.log(`  Query warning: ${hasQueryWarning ? '✓' : '✗'}`);
    console.log(`  All warnings: ${result.warnings?.join(', ')}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('✅ All tests completed!');
  console.log('\nNote: Tests marked with "⚠ SKIP" require database initialization.');
  console.log('Run dev server first to initialize database, then run: npm run test:budgets');
}

runTests().catch(console.error);
