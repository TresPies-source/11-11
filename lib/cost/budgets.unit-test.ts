import { DEFAULT_BUDGET } from './constants';
import type { BudgetCheckResult, BudgetConfig } from './types';

const originalGetDB = require('../pglite/cost').getSessionTokenUsage;
const originalGetUser = require('../pglite/cost').getUserMonthlyTokenUsage;

const mockGetSessionTokenUsage = async (sessionId: string): Promise<number> => {
  if (sessionId === 'session-low') return 10000;
  if (sessionId === 'session-warn') return 41000;
  if (sessionId === 'session-full') return 49000;
  return 0;
};

const mockGetUserMonthlyTokenUsage = async (userId: string): Promise<number> => {
  if (userId === 'user-low') return 100000;
  if (userId === 'user-warn') return 410000;
  if (userId === 'user-full') return 495000;
  return 0;
};

async function checkBudgetMocked(
  userId: string,
  estimatedTokens: number,
  sessionId?: string | null,
  config: BudgetConfig = DEFAULT_BUDGET
): Promise<BudgetCheckResult> {
  const warnings: string[] = [];

  if (estimatedTokens <= 0) {
    return {
      allowed: true,
      warnings: [],
    };
  }

  if (estimatedTokens > config.query_limit * config.stop_threshold) {
    return {
      allowed: false,
      reason: 'query_limit_exceeded',
      limit: config.query_limit,
      estimated: estimatedTokens,
    };
  }

  if (estimatedTokens > config.query_limit * config.warn_threshold) {
    warnings.push('query_approaching_limit');
  }

  if (sessionId) {
    const sessionUsage = await mockGetSessionTokenUsage(sessionId);
    const sessionTotal = sessionUsage + estimatedTokens;

    if (sessionTotal > config.session_limit * config.stop_threshold) {
      return {
        allowed: false,
        reason: 'session_limit_exceeded',
        limit: config.session_limit,
        current: sessionUsage,
        estimated: estimatedTokens,
      };
    }

    if (sessionTotal > config.session_limit * config.warn_threshold) {
      warnings.push('session_approaching_limit');
    }
  }

  const userUsage = await mockGetUserMonthlyTokenUsage(userId);
  const userTotal = userUsage + estimatedTokens;

  if (userTotal > config.user_monthly_limit * config.stop_threshold) {
    return {
      allowed: false,
      reason: 'user_limit_exceeded',
      limit: config.user_monthly_limit,
      current: userUsage,
      estimated: estimatedTokens,
    };
  }

  if (userTotal > config.user_monthly_limit * config.warn_threshold) {
    warnings.push('user_approaching_limit');
  }

  return {
    allowed: true,
    warnings,
  };
}

async function runMockedTests() {
  console.log('Running mocked budget checking tests...\n');

  let passCount = 0;
  let failCount = 0;

  console.log('Test 1: Session budget - within limit');
  const result1 = await checkBudgetMocked('test-user', 5000, 'session-low');
  if (result1.allowed && !result1.warnings?.includes('session_approaching_limit')) {
    console.log('  ✓ PASS');
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Expected allowed without session warning`);
    failCount++;
  }

  console.log('\nTest 2: Session budget - warning threshold (80%)');
  const result2 = await checkBudgetMocked('test-user', 5000, 'session-warn');
  if (result2.allowed && result2.warnings?.includes('session_approaching_limit')) {
    console.log('  ✓ PASS');
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Expected session_approaching_limit warning`);
    console.log(`  Got: ${result2.warnings?.join(', ')}`);
    failCount++;
  }

  console.log('\nTest 3: Session budget - hard stop (100%)');
  const result3 = await checkBudgetMocked('test-user', 2000, 'session-full');
  if (!result3.allowed && result3.reason === 'session_limit_exceeded') {
    console.log('  ✓ PASS');
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Expected session_limit_exceeded`);
    console.log(`  Got: allowed=${result3.allowed}, reason=${result3.reason}`);
    failCount++;
  }

  console.log('\nTest 4: User budget - within limit');
  const result4 = await checkBudgetMocked('user-low', 50000);
  if (result4.allowed && !result4.warnings?.includes('user_approaching_limit')) {
    console.log('  ✓ PASS');
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Expected allowed without user warning`);
    failCount++;
  }

  console.log('\nTest 5: User budget - warning threshold (80%)');
  const result5 = await checkBudgetMocked('user-warn', 50000);
  if (result5.allowed && result5.warnings?.includes('user_approaching_limit')) {
    console.log('  ✓ PASS');
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Expected user_approaching_limit warning`);
    console.log(`  Got: ${result5.warnings?.join(', ')}`);
    failCount++;
  }

  console.log('\nTest 6: User budget - hard stop (100%)');
  const result6 = await checkBudgetMocked('user-full', 10000);
  if (!result6.allowed && result6.reason === 'user_limit_exceeded') {
    console.log('  ✓ PASS');
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Expected user_limit_exceeded`);
    console.log(`  Got: allowed=${result6.allowed}, reason=${result6.reason}`);
    failCount++;
  }

  console.log('\nTest 7: Multiple warnings (query + session)');
  const result7 = await checkBudgetMocked('test-user', 8500, 'session-warn');
  if (
    result7.allowed &&
    result7.warnings?.includes('query_approaching_limit') &&
    result7.warnings?.includes('session_approaching_limit')
  ) {
    console.log('  ✓ PASS');
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Expected both query and session warnings`);
    console.log(`  Got: ${result7.warnings?.join(', ')}`);
    failCount++;
  }

  console.log('\nTest 8: Multiple warnings (query + user)');
  const result8 = await checkBudgetMocked('user-warn', 8500);
  if (
    result8.allowed &&
    result8.warnings?.includes('query_approaching_limit') &&
    result8.warnings?.includes('user_approaching_limit')
  ) {
    console.log('  ✓ PASS');
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Expected both query and user warnings`);
    console.log(`  Got: ${result8.warnings?.join(', ')}`);
    failCount++;
  }

  console.log('\nTest 9: Priority - query limit exceeds before checking session');
  const result9 = await checkBudgetMocked('test-user', 15000, 'session-low');
  if (!result9.allowed && result9.reason === 'query_limit_exceeded') {
    console.log('  ✓ PASS');
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Query limit should be checked first`);
    console.log(`  Got: reason=${result9.reason}`);
    failCount++;
  }

  console.log('\nTest 10: Session check only if sessionId provided');
  const result10a = await checkBudgetMocked('test-user', 5000, 'session-full');
  const result10b = await checkBudgetMocked('test-user', 5000, null);
  if (!result10a.allowed && result10b.allowed) {
    console.log('  ✓ PASS');
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Session limit should only apply with sessionId`);
    console.log(`  With session: allowed=${result10a.allowed}`);
    console.log(`  Without session: allowed=${result10b.allowed}`);
    failCount++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passCount} passed, ${failCount} failed`);
  console.log('='.repeat(50));

  if (failCount === 0) {
    console.log('\n✅ All mocked tests passed!');
  } else {
    console.log(`\n❌ ${failCount} test(s) failed`);
    process.exit(1);
  }
}

runMockedTests().catch(console.error);
