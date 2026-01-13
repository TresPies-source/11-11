import { checkBudget, formatBudgetError, formatBudgetWarnings } from './budgets';
import type { BudgetConfig } from './types';

async function runSimpleTests() {
  console.log('Running simple budget checking tests (no database)...\n');

  let passCount = 0;
  let failCount = 0;

  console.log('Test 1: Query budget - within limit (5000 tokens)');
  try {
    const result = await checkBudget('test-user', 5000);
    if (result.allowed && (!result.warnings || result.warnings.length === 0)) {
      console.log('  ✓ PASS');
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected allowed=true, warnings=0, got allowed=${result.allowed}, warnings=${result.warnings?.length || 0}`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 2: Query budget - warning threshold (8500 tokens, >80% of 10000)');
  try {
    const result = await checkBudget('test-user', 8500);
    if (result.allowed && result.warnings?.includes('query_approaching_limit')) {
      console.log('  ✓ PASS');
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected allowed=true with query_approaching_limit warning`);
      console.log(`  Got: allowed=${result.allowed}, warnings=${result.warnings?.join(', ')}`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 3: Query budget - hard stop (11000 tokens, >100% of 10000)');
  try {
    const result = await checkBudget('test-user', 11000);
    if (!result.allowed && result.reason === 'query_limit_exceeded') {
      console.log('  ✓ PASS');
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected allowed=false with query_limit_exceeded`);
      console.log(`  Got: allowed=${result.allowed}, reason=${result.reason}`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 4: Edge case - zero tokens');
  try {
    const result = await checkBudget('test-user', 0);
    if (result.allowed && (!result.warnings || result.warnings.length === 0)) {
      console.log('  ✓ PASS');
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected allowed=true for zero tokens`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 5: Edge case - negative tokens');
  try {
    const result = await checkBudget('test-user', -100);
    if (result.allowed) {
      console.log('  ✓ PASS');
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected allowed=true for negative tokens`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 6: Edge case - no session ID');
  try {
    const result = await checkBudget('test-user', 5000, null);
    if (result.allowed) {
      console.log('  ✓ PASS');
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected allowed=true without session`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 7: Custom budget configuration');
  try {
    const customConfig: BudgetConfig = {
      query_limit: 5000,
      session_limit: 25000,
      user_monthly_limit: 250000,
      warn_threshold: 0.8,
      stop_threshold: 1.0,
    };
    const result = await checkBudget('test-user', 6000, null, customConfig);
    if (!result.allowed && result.reason === 'query_limit_exceeded') {
      console.log('  ✓ PASS');
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Custom config not applied correctly`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 8: formatBudgetError - query exceeded');
  const queryError = formatBudgetError({
    allowed: false,
    reason: 'query_limit_exceeded',
    limit: 10000,
    estimated: 11000,
  });
  if (queryError.includes('Query budget exceeded') && queryError.includes('11000') && queryError.includes('10000')) {
    console.log('  ✓ PASS');
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Incorrect error message: ${queryError}`);
    failCount++;
  }

  console.log('\nTest 9: formatBudgetError - session exceeded');
  const sessionError = formatBudgetError({
    allowed: false,
    reason: 'session_limit_exceeded',
    limit: 50000,
    current: 30000,
    estimated: 25000,
  });
  if (sessionError.includes('Session budget exceeded')) {
    console.log('  ✓ PASS');
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Incorrect error message: ${sessionError}`);
    failCount++;
  }

  console.log('\nTest 10: formatBudgetError - user exceeded');
  const userError = formatBudgetError({
    allowed: false,
    reason: 'user_limit_exceeded',
    limit: 500000,
    current: 450000,
    estimated: 60000,
  });
  if (userError.includes('Monthly budget exceeded')) {
    console.log('  ✓ PASS');
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Incorrect error message: ${userError}`);
    failCount++;
  }

  console.log('\nTest 11: formatBudgetWarnings');
  const warnings = formatBudgetWarnings([
    'query_approaching_limit',
    'session_approaching_limit',
    'user_approaching_limit',
  ]);
  if (warnings.length === 3 && warnings.every(w => w.includes('Warning'))) {
    console.log('  ✓ PASS');
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Warnings not formatted correctly`);
    failCount++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passCount} passed, ${failCount} failed`);
  console.log('='.repeat(50));

  if (failCount === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log(`\n❌ ${failCount} test(s) failed`);
    process.exit(1);
  }
}

runSimpleTests().catch(console.error);
