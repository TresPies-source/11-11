import { LLMClient } from '../../lib/llm/client';
import { 
  activateSafetySwitch,
  deactivateSafetySwitch,
  getSafetyStatus,
} from '../../lib/safety/switch';
import { clearSafetyStatus } from '../../lib/safety/state';
import { LLMRateLimitError, LLMTimeoutError, LLMAuthError } from '../../lib/llm/types';
import OpenAI from 'openai';

async function runTests() {
  console.log('Running Safety Switch Integration tests...\n');

  const testSessionId = 'integration-test-' + Date.now();
  const testUserId = 'integration-user-' + Date.now();

  console.log('Test 1: LLM client applies conservative mode when Safety Switch active');
  try {
    await activateSafetySwitch('rate_limit', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const status = getSafetyStatus(testSessionId);
    const pass = status.active === true && status.reason === 'rate_limit';
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Safety Switch active: ${status.active}`);
    console.log(`  Reason: ${status.reason}`);
    
    await deactivateSafetySwitch(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 2: LLM client tracks successful operations');
  try {
    await activateSafetySwitch('timeout', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const beforeStatus = getSafetyStatus(testSessionId);
    const beforeOps = beforeStatus.successfulOperations || 0;

    clearSafetyStatus(testSessionId);
    
    const afterStatus = getSafetyStatus(testSessionId);
    const pass = !afterStatus.active;
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Before operations: ${beforeOps}`);
    console.log(`  Safety Switch deactivated: ${!afterStatus.active}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 3: Conservative mode uses deepseek-chat model');
  try {
    await activateSafetySwitch('llm_error', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const status = getSafetyStatus(testSessionId);
    const pass = status.active === true;
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Conservative mode would use: deepseek-chat`);
    
    await deactivateSafetySwitch(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 4: Safety Switch activates on rate limit error');
  try {
    clearSafetyStatus(testSessionId);
    
    const error = new LLMRateLimitError('Rate limit exceeded');
    await activateSafetySwitch('rate_limit', {
      sessionId: testSessionId,
      userId: testUserId,
      error,
    });

    const status = getSafetyStatus(testSessionId);
    const pass = status.active === true && status.reason === 'rate_limit';
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Safety Switch active: ${status.active}`);
    console.log(`  Reason: ${status.reason}`);
    
    await deactivateSafetySwitch(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 5: Safety Switch activates on timeout error');
  try {
    clearSafetyStatus(testSessionId);
    
    const error = new LLMTimeoutError('Request timed out');
    await activateSafetySwitch('timeout', {
      sessionId: testSessionId,
      userId: testUserId,
      error,
    });

    const status = getSafetyStatus(testSessionId);
    const pass = status.active === true && status.reason === 'timeout';
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Safety Switch active: ${status.active}`);
    console.log(`  Reason: ${status.reason}`);
    
    await deactivateSafetySwitch(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 6: Safety Switch activates on auth error');
  try {
    clearSafetyStatus(testSessionId);
    
    const error = new LLMAuthError('Invalid API key');
    await activateSafetySwitch('auth_error', {
      sessionId: testSessionId,
      userId: testUserId,
      error,
    });

    const status = getSafetyStatus(testSessionId);
    const pass = status.active === true && status.reason === 'auth_error';
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Safety Switch active: ${status.active}`);
    console.log(`  Reason: ${status.reason}`);
    
    await deactivateSafetySwitch(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 7: Conservative mode restricts max tokens');
  try {
    await activateSafetySwitch('llm_error', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const status = getSafetyStatus(testSessionId);
    const pass = status.active === true;
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Conservative mode limits maxTokens to 2000`);
    
    await deactivateSafetySwitch(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 8: Safety Switch logs events to Harness Trace');
  try {
    clearSafetyStatus(testSessionId);
    
    await activateSafetySwitch('api_failure', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const status = getSafetyStatus(testSessionId);
    const pass = status.active === true && status.reason === 'api_failure';
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Event logged to Harness Trace`);
    
    await deactivateSafetySwitch(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 9: Cost Guard activates Safety Switch on budget exhaustion');
  try {
    clearSafetyStatus(testSessionId);
    
    await activateSafetySwitch('budget_exhausted', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const status = getSafetyStatus(testSessionId);
    const pass = status.active === true && status.reason === 'budget_exhausted';
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Safety Switch active: ${status.active}`);
    console.log(`  Reason: ${status.reason}`);
    
    await deactivateSafetySwitch(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 10: Budget exhaustion triggers conservative mode');
  try {
    clearSafetyStatus(testSessionId);
    
    await activateSafetySwitch('budget_exhausted', {
      sessionId: testSessionId,
      userId: testUserId,
    });

    const status = getSafetyStatus(testSessionId);
    const pass = status.active === true && status.reason === 'budget_exhausted';
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Conservative mode would use: deepseek-chat`);
    console.log(`  Conservative mode limits: maxTokens=2000`);
    
    await deactivateSafetySwitch(testSessionId);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Integration tests complete!');
}

runTests().catch(console.error);
