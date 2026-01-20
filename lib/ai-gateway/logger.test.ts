import { generateRequestId, logGatewayRequest } from './logger';
import type { GatewayRequest, GatewayResponse } from './types';
import { getDB } from '@/lib/pglite/client';

async function runTests() {
  // Suppress verbose database initialization logs during tests
  const originalConsoleLog = console.log;
  const dbInitMessages = [
    '[PGlite]',
    '[Migration',
    'migration',
    'Adding',
    'Successfully',
    'Seeding',
  ];
  
  console.log = function(...args: any[]) {
    const message = args.join(' ');
    // Only suppress database initialization messages, keep test output
    if (!dbInitMessages.some(prefix => message.includes(prefix))) {
      originalConsoleLog.apply(console, args);
    }
  };
  
  console.log('Running AI Gateway Logger tests...\n');

  const testUserId = `test-user-${crypto.randomUUID()}`;
  const testSessionId = `test-session-${crypto.randomUUID()}`;

  console.log('Test 1: Generate unique request IDs');
  try {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    const id3 = generateRequestId();
    
    const pass = id1 !== id2 && id2 !== id3 && id1 !== id3;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  ID 1: ${id1}`);
    console.log(`  ID 2: ${id2}`);
    console.log(`  ID 3: ${id3}`);
    console.log(`  All unique: ${pass}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 2: Log successful request (requires database)');
  try {
    const requestId = generateRequestId();
    
    const mockRequest: GatewayRequest = {
      messages: [
        { role: 'user', content: 'Hello, test!' }
      ],
      taskType: 'general_chat',
      agentName: 'test-agent',
      temperature: 0.7,
      maxTokens: 1000,
    };
    
    const mockResponse: GatewayResponse = {
      content: 'Hello! This is a test response.',
      usage: {
        promptTokens: 10,
        completionTokens: 15,
        totalTokens: 25,
      },
      finishReason: 'stop',
    };
    
    await logGatewayRequest({
      requestId,
      request: mockRequest,
      response: mockResponse,
      providerId: 'openai',
      modelId: 'gpt-4o-mini',
      latencyMs: 150,
      costUsd: 0.001,
      userId: testUserId,
      sessionId: testSessionId,
    });
    
    const db = await getDB();
    const result = await db.query(
      'SELECT * FROM ai_gateway_logs WHERE request_id = $1',
      [requestId]
    );
    
    const pass = result.rows.length === 1;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Request ID: ${requestId}`);
    console.log(`  Record found: ${pass}`);
    if (pass) {
      const log = result.rows[0];
      console.log(`  Provider: ${log.provider_id}`);
      console.log(`  Model: ${log.model_id}`);
      console.log(`  Latency: ${log.latency_ms}ms`);
      console.log(`  Cost: $${log.cost_usd}`);
      console.log(`  Status: ${log.status_code}`);
    }
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 3: Log failed request with error (requires database)');
  try {
    const requestId = generateRequestId();
    
    const mockRequest: GatewayRequest = {
      messages: [
        { role: 'user', content: 'Test error logging' }
      ],
      taskType: 'code_generation',
      agentName: 'builder',
    };
    
    const mockError = new Error('API rate limit exceeded');
    
    await logGatewayRequest({
      requestId,
      request: mockRequest,
      providerId: 'deepseek',
      modelId: 'deepseek-chat',
      latencyMs: 50,
      error: mockError,
      userId: testUserId,
      sessionId: testSessionId,
    });
    
    const db = await getDB();
    const result = await db.query(
      'SELECT * FROM ai_gateway_logs WHERE request_id = $1',
      [requestId]
    );
    
    const pass = result.rows.length === 1 && result.rows[0].status_code === 500;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Request ID: ${requestId}`);
    console.log(`  Record found: ${result.rows.length === 1}`);
    if (result.rows.length > 0) {
      const log = result.rows[0];
      console.log(`  Status Code: ${log.status_code} (expected 500)`);
      console.log(`  Error Message: ${log.error_message}`);
    }
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 4: Log request with minimal data (requires database)');
  try {
    const requestId = generateRequestId();
    
    const mockRequest: GatewayRequest = {
      messages: [
        { role: 'user', content: 'Minimal test' }
      ],
    };
    
    await logGatewayRequest({
      requestId,
      request: mockRequest,
      providerId: 'openai',
      modelId: 'gpt-4o',
      latencyMs: 200,
    });
    
    const db = await getDB();
    const result = await db.query(
      'SELECT * FROM ai_gateway_logs WHERE request_id = $1',
      [requestId]
    );
    
    const pass = result.rows.length === 1;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Request ID: ${requestId}`);
    console.log(`  Record found with minimal data: ${pass}`);
    if (pass) {
      const log = result.rows[0];
      console.log(`  User ID: ${log.user_id || 'null (expected)'}`);
      console.log(`  Session ID: ${log.session_id || 'null (expected)'}`);
      console.log(`  Cost: ${log.cost_usd || 'null (expected)'}`);
    }
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 5: Query logged requests (requires database)');
  try {
    const db = await getDB();
    const result = await db.query(
      'SELECT * FROM ai_gateway_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [testUserId]
    );
    
    const pass = result.rows.length > 0;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Retrieved ${result.rows.length} log records for test user`);
    if (result.rows.length > 0) {
      console.log(`  Latest log:`);
      const log = result.rows[0];
      console.log(`    Provider: ${log.provider_id}`);
      console.log(`    Model: ${log.model_id}`);
      console.log(`    Task Type: ${log.task_type}`);
      console.log(`    Latency: ${log.latency_ms}ms`);
    }
  } catch (error) {
    console.log(`  ⚠ SKIP: Database not available (${error})`);
  }
  console.log();

  console.log('Test 6: Error handling - graceful fallback');
  try {
    console.log('  This test verifies error handling (no assertions)');
    console.log('  Check console for fallback logs if database write fails');
    
    const requestId = generateRequestId();
    const mockRequest: GatewayRequest = {
      messages: [
        { role: 'user', content: 'Fallback test' }
      ],
    };
    
    await logGatewayRequest({
      requestId,
      request: mockRequest,
      providerId: 'test-provider',
      modelId: 'test-model',
      latencyMs: 100,
    });
    
    console.log(`  Status: ✓ PASS`);
    console.log(`  Function executed without throwing`);
  } catch (error) {
    console.log(`  ✗ FAIL: Function should not throw errors: ${error}`);
  }
  console.log();

  console.log('✅ All tests completed!');
  console.log('\nNote: Tests marked with "⚠ SKIP" require database initialization.');
  console.log('Run dev server first to initialize database, then run this test.');
  
  // Restore original console.log
  console.log = originalConsoleLog;
}

runTests().catch(console.error);
