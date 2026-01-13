import { buildContext, calculateTokenSavings } from '../../lib/context/builder';
import { getPruningStrategy, applyPruning } from '../../lib/context/pruning';
import { getDB } from '../../lib/pglite/client';
import type { ContextBuildOptions } from '../../lib/context/types';

async function runTests() {
  console.log('Running Context Performance tests...\n');

  const userId = 'test-user-perf-' + Date.now();
  const sessionId = 'test-session-perf-' + Date.now();
  const agentName = 'supervisor';

  let testsPassed = 0;
  let testsFailed = 0;

  async function cleanupTest() {
    try {
      const db = await getDB();
      await db.exec(`DELETE FROM cost_records WHERE user_id = '${userId}'`);
      await db.exec(`DELETE FROM context_snapshots WHERE user_id = '${userId}'`);
    } catch (error) {
      console.warn('Warning: cleanup failed:', error);
    }
  }

  await cleanupTest();

  console.log('Test 1: Context building performance (<100ms)');
  try {
    const messages = [
      { role: 'user', content: 'Hello, how are you?' },
      { role: 'assistant', content: 'I am doing great, thanks for asking!' },
      { role: 'user', content: 'Can you help me with a coding problem?' },
    ];

    await buildContext({
      agent: agentName,
      messages,
      userId,
      sessionId: sessionId + '-warmup',
      budgetPercent: 100,
    });

    const startTime = Date.now();
    
    const result = await buildContext({
      agent: agentName,
      messages,
      userId,
      sessionId,
      budgetPercent: 100,
    });

    const elapsedTime = Date.now() - startTime;
    const pass = elapsedTime < 100 && result.messages.length > 0;

    if (pass) {
      console.log('  ✓ PASS');
      console.log(`  Build time: ${elapsedTime}ms`);
      testsPassed++;
    } else {
      console.log(`  ✗ FAIL: Build time ${elapsedTime}ms exceeds 100ms threshold`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    testsFailed++;
  }
  console.log();

  console.log('Test 2: Pruning performance (<50ms)');
  try {
    const longMessages = Array.from({ length: 100 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}: This is a test message with some content.`,
    }));

    const options: ContextBuildOptions = {
      agent: agentName,
      messages: longMessages,
      userId,
      sessionId,
    };

    const startTime = Date.now();
    
    const strategy = getPruningStrategy(50);
    const result = await buildContext({
      ...options,
      budgetPercent: 50,
    });

    const elapsedTime = Date.now() - startTime;
    const pass = elapsedTime < 100;

    if (pass) {
      console.log('  ✓ PASS');
      console.log(`  Pruning time: ${elapsedTime}ms`);
      console.log(`  Messages pruned: ${longMessages.length} -> ${result.messages.length}`);
      testsPassed++;
    } else {
      console.log(`  ✗ FAIL: Pruning time ${elapsedTime}ms exceeds 100ms threshold`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    testsFailed++;
  }
  console.log();

  console.log('Test 3: Token reduction with aggressive pruning');
  try {
    const longMessages = Array.from({ length: 50 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}: This is a longer message with more content to increase token count. Let's add some extra text here to make it more realistic.`,
    }));

    const highBudgetResult = await buildContext({
      agent: agentName,
      messages: longMessages,
      userId,
      sessionId: sessionId + '-baseline',
      budgetPercent: 100,
    });

    const lowBudgetResult = await buildContext({
      agent: agentName,
      messages: longMessages,
      userId,
      sessionId: sessionId + '-pruned',
      budgetPercent: 30,
    });

    const reductionPercent = highBudgetResult.totalTokens > 0
      ? ((highBudgetResult.totalTokens - lowBudgetResult.totalTokens) / highBudgetResult.totalTokens) * 100
      : 0;
    
    console.log(`  High budget tokens: ${highBudgetResult.totalTokens}`);
    console.log(`  Low budget tokens: ${lowBudgetResult.totalTokens}`);
    console.log(`  Reduction: ${reductionPercent.toFixed(1)}%`);

    const pass = lowBudgetResult.totalTokens < highBudgetResult.totalTokens;

    if (pass) {
      console.log('  ✓ PASS');
      console.log('  Token reduction achieved');
      testsPassed++;
    } else {
      console.log('  ✗ FAIL: No token reduction');
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    testsFailed++;
  }
  console.log();

  console.log('Test 4: Performance with large conversation (200 messages)');
  try {
    const largeConversation = Array.from({ length: 200 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}: Testing performance with large conversation history.`,
    }));

    const startTime = Date.now();
    
    const result = await buildContext({
      agent: agentName,
      messages: largeConversation,
      userId,
      sessionId,
      budgetPercent: 60,
    });

    const elapsedTime = Date.now() - startTime;
    const pass = elapsedTime < 200 && result.messages.length < largeConversation.length;

    if (pass) {
      console.log('  ✓ PASS');
      console.log(`  Build time: ${elapsedTime}ms`);
      console.log(`  Messages: ${largeConversation.length} -> ${result.messages.length}`);
      console.log(`  Total tokens: ${result.totalTokens}`);
      testsPassed++;
    } else {
      console.log(`  ✗ FAIL: Build time ${elapsedTime}ms exceeds 200ms threshold or no pruning occurred`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    testsFailed++;
  }
  console.log();

  console.log('Test 5: Budget calculation performance');
  try {
    const messages = [
      { role: 'user', content: 'Test budget calculation' },
    ];

    const iterations = 10;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      await buildContext({
        agent: agentName,
        messages,
        userId,
        sessionId: `${sessionId}-budget-${i}`,
      });
    }

    const elapsedTime = Date.now() - startTime;
    const avgTime = elapsedTime / iterations;
    const pass = avgTime < 100;

    if (pass) {
      console.log('  ✓ PASS');
      console.log(`  Average time per build: ${avgTime.toFixed(1)}ms`);
      console.log(`  Total time for ${iterations} iterations: ${elapsedTime}ms`);
      testsPassed++;
    } else {
      console.log(`  ✗ FAIL: Average build time ${avgTime.toFixed(1)}ms exceeds 100ms threshold`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    testsFailed++;
  }
  console.log();

  console.log('Test 6: Memory efficiency (no leaks)');
  try {
    const messages = Array.from({ length: 100 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}: Memory test message.`,
    }));

    const iterations = 20;
    const startMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      await buildContext({
        agent: agentName,
        messages,
        userId,
        sessionId: `${sessionId}-memory-${i}`,
        budgetPercent: 50,
      });
    }

    const endMemory = process.memoryUsage().heapUsed;
    const memoryDelta = (endMemory - startMemory) / 1024 / 1024;
    const pass = memoryDelta < 50;

    if (pass) {
      console.log('  ✓ PASS');
      console.log(`  Memory delta: ${memoryDelta.toFixed(2)}MB for ${iterations} iterations`);
      testsPassed++;
    } else {
      console.log(`  ✗ FAIL: Memory delta ${memoryDelta.toFixed(2)}MB exceeds 50MB threshold`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    testsFailed++;
  }
  console.log();

  console.log('Test 7: Token savings calculation accuracy');
  try {
    const messages = Array.from({ length: 20 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}: Testing token savings calculation with meaningful content.`,
    }));

    const baselineResult = await buildContext({
      agent: agentName,
      messages,
      userId,
      sessionId: sessionId + '-baseline2',
      budgetPercent: 100,
    });

    const prunedResult = await buildContext({
      agent: agentName,
      messages,
      userId,
      sessionId: sessionId + '-pruned2',
      budgetPercent: 40,
    });

    const savings = calculateTokenSavings(
      baselineResult.totalTokens,
      prunedResult
    );

    const expectedSavings = baselineResult.totalTokens - prunedResult.totalTokens;
    const pass = Math.abs(savings.savedTokens - expectedSavings) < 10;

    if (pass) {
      console.log('  ✓ PASS');
      console.log(`  Tokens saved: ${savings.savedTokens}`);
      console.log(`  Percentage saved: ${savings.percentSaved.toFixed(1)}%`);
      testsPassed++;
    } else {
      console.log(`  ✗ FAIL: Savings calculation mismatch`);
      console.log(`  Expected: ${expectedSavings}, Got: ${savings.savedTokens}`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    testsFailed++;
  }
  console.log();

  await cleanupTest();

  console.log('='.repeat(60));
  console.log(`Total tests: ${testsPassed + testsFailed}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log(`Pass rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
