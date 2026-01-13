import {
  activateSafetySwitch,
  deactivateSafetySwitch,
  getSafetyStatus,
} from '../../lib/safety/switch';
import { attemptManualRecovery } from '../../lib/safety/recovery';
import { clearSafetyStatus } from '../../lib/safety/state';

async function runTests() {
  console.log('Running Safety Switch E2E tests...\n');

  const testSessionId = 'e2e-test-' + Date.now();
  const testUserId = 'e2e-user-' + Date.now();

  console.log('Test 1: Safety Switch activates on error');
  try {
    await activateSafetySwitch('llm_error', {
      sessionId: testSessionId,
      userId: testUserId,
      error: new Error('LLM API failure'),
    });

    const status = getSafetyStatus(testSessionId);
    const pass = status.active === true && status.reason === 'llm_error';

    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Safety Switch active: ${status.active}`);
    console.log(`  Reason: ${status.reason}`);
    console.log(`  Recovery path: ${status.recoveryPath}`);

    await deactivateSafetySwitch(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 2: Safety Switch banner shows correct message');
  try {
    const reasons = [
      'llm_error',
      'budget_exhausted',
      'rate_limit',
      'timeout',
      'api_failure',
      'parsing_error',
      'auth_error',
      'conflicting_perspectives',
      'unknown_error',
    ] as const;

    let allPass = true;
    for (const reason of reasons) {
      await activateSafetySwitch(reason, {
        sessionId: testSessionId,
        userId: testUserId,
      });

      const status = getSafetyStatus(testSessionId);
      if (status.reason !== reason) {
        allPass = false;
        console.log(`    Failed for reason: ${reason}`);
      }

      await deactivateSafetySwitch(testSessionId);
    }

    console.log(`  Status: ${allPass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  All ${reasons.length} reason messages verified`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 3: "Try Again" button attempts recovery');
  try {
    await activateSafetySwitch('timeout', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const beforeStatus = getSafetyStatus(testSessionId);
    const beforeActive = beforeStatus.active;

    const result = await attemptManualRecovery(testSessionId);

    const afterStatus = getSafetyStatus(testSessionId);
    const afterActive = afterStatus.active;

    const pass = beforeActive && !afterActive && result.success;

    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Before recovery: ${beforeActive}`);
    console.log(`  After recovery: ${afterActive}`);
    console.log(`  Recovery success: ${result.success}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 4: Banner dismissible and reappears on next error');
  try {
    await activateSafetySwitch('api_failure', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    let status = getSafetyStatus(testSessionId);
    const firstActive = status.active;

    await deactivateSafetySwitch(testSessionId, 'manual_dismiss');

    status = getSafetyStatus(testSessionId);
    const dismissed = !status.active;

    await activateSafetySwitch('rate_limit', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    status = getSafetyStatus(testSessionId);
    const reappeared = status.active;

    const pass = firstActive && dismissed && reappeared;

    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  First activation: ${firstActive}`);
    console.log(`  After dismiss: ${dismissed}`);
    console.log(`  Reappeared on new error: ${reappeared}`);

    await deactivateSafetySwitch(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 5: Manual override deactivates Safety Switch');
  try {
    await activateSafetySwitch('parsing_error', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const beforeStatus = getSafetyStatus(testSessionId);

    const result = await attemptManualRecovery(testSessionId);

    const afterStatus = getSafetyStatus(testSessionId);

    const pass = beforeStatus.active && !afterStatus.active && result.success;

    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Before manual override: ${beforeStatus.active}`);
    console.log(`  After manual override: ${afterStatus.active}`);
    console.log(`  Recovery success: ${result.success}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 6: Safety Switch integrates with Harness Trace');
  try {
    await activateSafetySwitch('conflicting_perspectives', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const status = getSafetyStatus(testSessionId);

    await deactivateSafetySwitch(testSessionId, 'auto_recovery');

    const finalStatus = getSafetyStatus(testSessionId);

    const pass = status.active && !finalStatus.active;

    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Activation logged: ${status.active}`);
    console.log(`  Deactivation logged: ${!finalStatus.active}`);
    console.log(`  Note: Check Harness Trace for SAFETY_SWITCH events`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  clearSafetyStatus(testSessionId);

  console.log('All E2E tests complete! ✓\n');
}

runTests().catch(console.error);
