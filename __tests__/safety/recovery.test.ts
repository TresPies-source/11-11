import {
  attemptAutoRecovery,
  attemptManualRecovery,
  isRecoverySafe,
  trackSuccessfulOperation,
} from '../../lib/safety/recovery';
import {
  activateSafetySwitch,
  getSafetyStatus,
} from '../../lib/safety/switch';
import {
  clearSafetyStatus,
  getSafetyStatusFromState,
} from '../../lib/safety/state';
import type { BudgetCheckResult } from '../../lib/cost/types';

async function runTests() {
  console.log('Running Recovery tests...\n');

  const testSessionId = 'test-recovery-session-' + Date.now();
  const testUserId = 'test-user-' + Date.now();

  console.log('Test 1: attemptAutoRecovery - fails without successful operations');
  try {
    await activateSafetySwitch('llm_error', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const result = await attemptAutoRecovery(testSessionId);
    const pass = result.success === false && result.reason?.includes('successful operation');
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Reason: ${result.reason}`);

    clearSafetyStatus(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 2: trackSuccessfulOperation - increments counter');
  try {
    await activateSafetySwitch('llm_error', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const statusBefore = getSafetyStatusFromState(testSessionId);
    trackSuccessfulOperation(testSessionId);
    const statusAfter = getSafetyStatusFromState(testSessionId);

    const pass = 
      (statusBefore.successfulOperations || 0) === 0 &&
      (statusAfter.successfulOperations || 0) === 1;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Before: ${statusBefore.successfulOperations || 0}`);
    console.log(`  After: ${statusAfter.successfulOperations || 0}`);

    clearSafetyStatus(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 3: attemptAutoRecovery - succeeds after 1 successful operation');
  try {
    await activateSafetySwitch('llm_error', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    trackSuccessfulOperation(testSessionId);

    const result = await attemptAutoRecovery(testSessionId);
    const statusAfter = getSafetyStatus(testSessionId);

    const pass = result.success === true && statusAfter.active === false;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Safety active after: ${statusAfter.active}`);

    clearSafetyStatus(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 4: isRecoverySafe - fails when budget exhausted');
  try {
    await activateSafetySwitch('budget_exhausted', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const budgetStatus: BudgetCheckResult = {
      allowed: false,
      reason: 'user_limit_exceeded',
      limit: 100000,
      current: 95000,
    };

    const safe = isRecoverySafe(testSessionId, budgetStatus, 0);
    const pass = safe === false;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Recovery safe: ${safe}`);

    clearSafetyStatus(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 5: isRecoverySafe - fails when recent errors exist');
  try {
    await activateSafetySwitch('llm_error', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const safe = isRecoverySafe(testSessionId, undefined, 2);
    const pass = safe === false;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Recovery safe: ${safe}`);

    clearSafetyStatus(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 6: attemptManualRecovery - always succeeds');
  try {
    await activateSafetySwitch('llm_error', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const result = await attemptManualRecovery(testSessionId);
    const statusAfter = getSafetyStatus(testSessionId);

    const pass = result.success === true && statusAfter.active === false;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Safety active after: ${statusAfter.active}`);

    clearSafetyStatus(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 7: attemptManualRecovery - works even with budget exhaustion');
  try {
    const budgetStatus: BudgetCheckResult = {
      allowed: false,
      reason: 'user_limit_exceeded',
      limit: 100000,
      current: 95000,
    };

    await activateSafetySwitch('budget_exhausted', {
      sessionId: testSessionId,
      userId: testUserId,
      budgetStatus,
    });

    const result = await attemptManualRecovery(testSessionId);
    const statusAfter = getSafetyStatus(testSessionId);

    const pass = result.success === true && statusAfter.active === false;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Safety active after: ${statusAfter.active}`);

    clearSafetyStatus(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 8: isRecoverySafe - allows recovery when budget sufficient');
  try {
    await activateSafetySwitch('llm_error', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const budgetStatus: BudgetCheckResult = {
      allowed: true,
      limit: 100000,
      current: 50000,
    };

    const safe = isRecoverySafe(testSessionId, budgetStatus, 0);
    const pass = safe === true;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Recovery safe: ${safe}`);

    clearSafetyStatus(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Recovery tests complete!\n');
}

runTests();
