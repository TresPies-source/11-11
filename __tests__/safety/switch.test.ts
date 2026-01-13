import { 
  activateSafetySwitch,
  deactivateSafetySwitch,
  shouldActivateSafetySwitch,
  getSafetyStatus,
  isSafetyActive,
  getErrorReason,
} from '../../lib/safety/switch';
import { 
  setSafetyStatus,
  getSafetyStatusFromState,
  clearSafetyStatus,
  getAllSafetyStates,
} from '../../lib/safety/state';
import { LLMAuthError, LLMRateLimitError, LLMTimeoutError } from '../../lib/llm/types';
import type { BudgetCheckResult } from '../../lib/cost/types';

async function runTests() {
  console.log('Running Safety Switch tests...\n');

  const testSessionId = 'test-session-' + Date.now();
  const testUserId = 'test-user-' + Date.now();

  console.log('Test 1: shouldActivateSafetySwitch - detects budget exhaustion');
  try {
    const budgetStatus: BudgetCheckResult = {
      allowed: false,
      reason: 'user_limit_exceeded',
      limit: 100000,
      current: 95000,
      estimated: 6000,
    };
    const shouldActivate = shouldActivateSafetySwitch(undefined, budgetStatus, 0);
    const pass = shouldActivate === true;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Should activate: ${shouldActivate}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 2: shouldActivateSafetySwitch - detects rate limit errors');
  try {
    const error = new LLMRateLimitError('Rate limit exceeded');
    const shouldActivate = shouldActivateSafetySwitch(error, undefined, 0);
    const pass = shouldActivate === true;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Should activate: ${shouldActivate}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 3: shouldActivateSafetySwitch - detects timeout errors');
  try {
    const error = new LLMTimeoutError('Request timeout');
    const shouldActivate = shouldActivateSafetySwitch(error, undefined, 0);
    const pass = shouldActivate === true;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Should activate: ${shouldActivate}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 4: shouldActivateSafetySwitch - detects auth errors');
  try {
    const error = new LLMAuthError('Unauthorized');
    const shouldActivate = shouldActivateSafetySwitch(error, undefined, 0);
    const pass = shouldActivate === true;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Should activate: ${shouldActivate}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 5: shouldActivateSafetySwitch - detects multiple recent errors');
  try {
    const shouldActivate = shouldActivateSafetySwitch(undefined, undefined, 3);
    const pass = shouldActivate === true;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Should activate: ${shouldActivate} (recent errors: 3)`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 6: shouldActivateSafetySwitch - does not activate for allowed budget');
  try {
    const budgetStatus: BudgetCheckResult = {
      allowed: true,
      warnings: [],
    };
    const shouldActivate = shouldActivateSafetySwitch(undefined, budgetStatus, 0);
    const pass = shouldActivate === false;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Should activate: ${shouldActivate}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 7: activateSafetySwitch - updates state correctly');
  try {
    await activateSafetySwitch('rate_limit', {
      sessionId: testSessionId,
      userId: testUserId,
    });
    const status = getSafetyStatus(testSessionId);
    const pass = 
      status.active === true &&
      status.reason === 'rate_limit' &&
      status.activatedAt !== undefined &&
      status.recoveryPath !== undefined;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Active: ${status.active}, Reason: ${status.reason}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 8: getSafetyStatus - returns correct status');
  try {
    const status = getSafetyStatus(testSessionId);
    const pass = 
      status.active === true &&
      status.reason === 'rate_limit';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Active: ${status.active}, Reason: ${status.reason}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 9: isSafetyActive - returns true when active');
  try {
    const isActive = isSafetyActive(testSessionId);
    const pass = isActive === true;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Is active: ${isActive}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 10: deactivateSafetySwitch - clears state correctly');
  try {
    deactivateSafetySwitch(testSessionId);
    const status = getSafetyStatus(testSessionId);
    const pass = status.active === false;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Active: ${status.active}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 11: getErrorReason - classifies auth errors');
  try {
    const error = new LLMAuthError('Unauthorized');
    const reason = getErrorReason(error);
    const pass = reason === 'auth_error';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Reason: ${reason}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 12: getErrorReason - classifies rate limit errors');
  try {
    const error = new LLMRateLimitError('Rate limit exceeded');
    const reason = getErrorReason(error);
    const pass = reason === 'rate_limit';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Reason: ${reason}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 13: getErrorReason - classifies timeout errors');
  try {
    const error = new LLMTimeoutError('Request timeout');
    const reason = getErrorReason(error);
    const pass = reason === 'timeout';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Reason: ${reason}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 14: getErrorReason - classifies parsing errors');
  try {
    const error = new Error('Failed to parse JSON response');
    const reason = getErrorReason(error);
    const pass = reason === 'parsing_error';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Reason: ${reason}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 15: getErrorReason - classifies API failures');
  try {
    const error = new Error('API connection failed');
    const reason = getErrorReason(error);
    const pass = reason === 'api_failure';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Reason: ${reason}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 16: State persistence - stores and retrieves state');
  try {
    const testSessionId2 = 'test-session-persist-' + Date.now();
    await activateSafetySwitch('budget_exhausted', {
      sessionId: testSessionId2,
      userId: testUserId,
    });
    
    const status = getSafetyStatusFromState(testSessionId2);
    const pass = 
      status.active === true &&
      status.reason === 'budget_exhausted';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Active: ${status.active}, Reason: ${status.reason}`);
    
    clearSafetyStatus(testSessionId2);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 17: getSafetyStatus - returns inactive for unknown session');
  try {
    const status = getSafetyStatus('nonexistent-session');
    const pass = status.active === false;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Active: ${status.active}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 18: activateSafetySwitch - includes recovery path');
  try {
    const testSessionId3 = 'test-session-recovery-' + Date.now();
    await activateSafetySwitch('timeout', {
      sessionId: testSessionId3,
      userId: testUserId,
    });
    const status = getSafetyStatus(testSessionId3);
    const pass = 
      status.active === true &&
      status.recoveryPath !== undefined &&
      status.recoveryPath.length > 0;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Recovery path: ${status.recoveryPath}`);
    
    clearSafetyStatus(testSessionId3);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('\n===== All Safety Switch Tests Complete =====\n');
}

runTests().catch(console.error);
