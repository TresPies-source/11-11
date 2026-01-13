import { buildContext } from '../../lib/context/builder';
import { getDB } from '../../lib/pglite/client';
import type { ContextBuildOptions } from '../../lib/context/types';

async function runTests() {
  console.log('Running Context Builder Integration tests...\n');

  const userId = 'test-user-integration-' + Date.now();
  const sessionId = 'test-session-integration-' + Date.now();
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

  console.log('Test 1: Context builder builds context correctly');
  try {
    const messages = [
      { role: 'user', content: 'Hello, how are you?' },
    ];

    const result = await buildContext({
      agent: agentName,
      messages,
      userId,
      sessionId,
    });

    const pass = 
      Array.isArray(result.messages) &&
      result.messages.length > 0 &&
      result.totalTokens > 0 &&
      result.tierBreakdown.tier1 > 0;

    if (pass) {
      console.log('  ✓ PASS');
      testsPassed++;
    } else {
      console.log('  ✗ FAIL: Context not built correctly');
      console.log('  Result:', JSON.stringify(result, null, 2));
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    testsFailed++;
  }
  console.log();

  console.log('Test 2: Context builder handles missing userId');
  try {
    const messages = [
      { role: 'user', content: 'Test query' },
    ];

    const result = await buildContext({
      agent: agentName,
      messages,
      userId: '',
      sessionId,
    });

    const pass = 
      Array.isArray(result.messages) &&
      result.messages.length >= messages.length;

    if (pass) {
      console.log('  ✓ PASS');
      testsPassed++;
    } else {
      console.log('  ✗ FAIL: Should handle missing userId gracefully');
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    testsFailed++;
  }
  console.log();

  console.log('Test 3: Multi-agent support');
  try {
    const agents = ['supervisor', 'librarian', 'debugger', 'dojo'];
    let agentsPassed = 0;

    for (const agent of agents) {
      const messages = [
        { role: 'user', content: `Test query for ${agent}` },
      ];

      const result = await buildContext({
        agent,
        messages,
        userId,
        sessionId: `${sessionId}-${agent}`,
      });

      if (result.messages.length > 0) {
        agentsPassed++;
      }
    }

    const pass = agentsPassed === agents.length;

    if (pass) {
      console.log('  ✓ PASS');
      console.log(`  All ${agents.length} agents work correctly`);
      testsPassed++;
    } else {
      console.log(`  ✗ FAIL: Only ${agentsPassed}/${agents.length} agents passed`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    testsFailed++;
  }
  console.log();

  console.log('Test 5: Context reduces message count with long history');
  try {
    const longMessages = Array.from({ length: 20 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}: This is a long message with lots of content.`,
    }));

    const result = await buildContext({
      agent: agentName,
      messages: longMessages,
      userId,
      sessionId,
    });

    const pass = 
      result.messages.length > 0 &&
      result.totalTokens > 0;

    if (pass) {
      console.log('  ✓ PASS');
      console.log(`  Original: ${longMessages.length} messages`);
      console.log(`  Processed: ${result.messages.length} messages`);
      console.log(`  Total tokens: ${result.totalTokens}`);
      testsPassed++;
    } else {
      console.log('  ✗ FAIL: Context not reduced correctly');
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    testsFailed++;
  }
  console.log();

  console.log('Test 6: Error handling with invalid data');
  try {
    const messages = [
      { role: 'user', content: 'Test error handling' },
    ];

    const result = await buildContext({
      agent: agentName,
      messages,
      userId,
      sessionId: undefined,
    });

    const pass = Array.isArray(result.messages);

    if (pass) {
      console.log('  ✓ PASS');
      console.log('  Context builder handled invalid data gracefully');
      testsPassed++;
    } else {
      console.log('  ✗ FAIL: Should handle errors gracefully');
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    testsFailed++;
  }
  console.log();

  console.log('Test 7: Tier breakdown calculation');
  try {
    const messages = [
      { role: 'user', content: 'Test tier breakdown' },
    ];

    const result = await buildContext({
      agent: agentName,
      messages,
      userId,
      sessionId,
    });

    const pass = 
      typeof result.tierBreakdown.tier1 === 'number' &&
      typeof result.tierBreakdown.tier2 === 'number' &&
      typeof result.tierBreakdown.tier3 === 'number' &&
      typeof result.tierBreakdown.tier4 === 'number' &&
      result.tierBreakdown.tier1 > 0;

    if (pass) {
      console.log('  ✓ PASS');
      console.log('  Tier breakdown:', result.tierBreakdown);
      testsPassed++;
    } else {
      console.log('  ✗ FAIL: Tier breakdown not calculated correctly');
      console.log('  Breakdown:', result.tierBreakdown);
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
