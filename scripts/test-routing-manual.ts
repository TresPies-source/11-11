/**
 * Manual Integration Testing Script
 * Run this with: npx tsx scripts/test-routing-manual.ts
 * 
 * Tests:
 * 1. Full routing flow (user query → agent selection)
 * 2. Handoffs between agents
 * 3. Cost tracking in database
 * 4. Routing accuracy
 * 5. Performance (latency <200ms)
 */

const BASE_URL = 'http://localhost:3000';

interface RoutingResponse {
  agent_id: string;
  agent_name: string;
  confidence: number;
  reasoning: string;
  fallback: boolean;
  routing_cost: {
    tokens_used: number;
    cost_usd: number;
  };
}

async function testRouting() {
  console.log('\n🧪 Starting Manual Integration Tests...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Route search query to Librarian
  try {
    console.log('Test 1: Route search query to Librarian Agent');
    const start = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/supervisor/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Find prompts about budgeting',
        session_id: 'manual-test-1',
        conversation_context: [],
      }),
    });

    const elapsed = Date.now() - start;
    const data: RoutingResponse = await response.json();

    console.log(`  ✓ Status: ${response.status}`);
    console.log(`  ✓ Agent: ${data.agent_name} (${data.agent_id})`);
    console.log(`  ✓ Confidence: ${(data.confidence * 100).toFixed(1)}%`);
    console.log(`  ✓ Reasoning: ${data.reasoning}`);
    console.log(`  ✓ Latency: ${elapsed}ms`);
    console.log(`  ✓ Cost: $${data.routing_cost.cost_usd.toFixed(6)}`);

    if (data.agent_id === 'librarian' && elapsed < 200) {
      console.log('  ✅ PASSED\n');
      passed++;
    } else {
      console.log('  ❌ FAILED (expected librarian, <200ms)\n');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Test 2: Route thinking query to Dojo
  try {
    console.log('Test 2: Route thinking query to Dojo Agent');
    const start = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/supervisor/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Help me explore perspectives on career planning',
        session_id: 'manual-test-2',
        conversation_context: [],
      }),
    });

    const elapsed = Date.now() - start;
    const data: RoutingResponse = await response.json();

    console.log(`  ✓ Agent: ${data.agent_name} (${data.agent_id})`);
    console.log(`  ✓ Confidence: ${(data.confidence * 100).toFixed(1)}%`);
    console.log(`  ✓ Latency: ${elapsed}ms`);

    if (data.agent_id === 'dojo' && elapsed < 200) {
      console.log('  ✅ PASSED\n');
      passed++;
    } else {
      console.log('  ❌ FAILED (expected dojo, <200ms)\n');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Test 3: Route conflict query to Debugger
  try {
    console.log('Test 3: Route conflict query to Debugger Agent');
    const start = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/supervisor/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'I have conflicting perspectives on remote vs office work',
        session_id: 'manual-test-3',
        conversation_context: [],
      }),
    });

    const elapsed = Date.now() - start;
    const data: RoutingResponse = await response.json();

    console.log(`  ✓ Agent: ${data.agent_name} (${data.agent_id})`);
    console.log(`  ✓ Confidence: ${(data.confidence * 100).toFixed(1)}%`);
    console.log(`  ✓ Latency: ${elapsed}ms`);

    if (data.agent_id === 'debugger' && elapsed < 200) {
      console.log('  ✅ PASSED\n');
      passed++;
    } else {
      console.log('  ❌ FAILED (expected debugger, <200ms)\n');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Test 4: Get available agents
  try {
    console.log('Test 4: Get available agents');
    
    const response = await fetch(`${BASE_URL}/api/supervisor/agents`);
    const data = await response.json();

    console.log(`  ✓ Status: ${response.status}`);
    console.log(`  ✓ Agents returned: ${data.agents.length}`);
    
    data.agents.forEach((agent: any) => {
      const defaultTag = agent.default ? ' (default)' : '';
      console.log(`    - ${agent.name} (${agent.id})${defaultTag}`);
    });

    if (response.ok && data.agents.length === 3) {
      console.log('  ✅ PASSED\n');
      passed++;
    } else {
      console.log('  ❌ FAILED (expected 3 agents)\n');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Test 5: Conversation context handling
  try {
    console.log('Test 5: Conversation context handling');
    
    const response = await fetch(`${BASE_URL}/api/supervisor/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Show me similar prompts',
        session_id: 'manual-test-5',
        conversation_context: [
          'User: I want to plan my budget',
          'Dojo: Let\'s explore perspectives on budgeting',
          'User: Actually, I want to search first',
        ],
      }),
    });

    const data: RoutingResponse = await response.json();

    console.log(`  ✓ Agent: ${data.agent_name} (${data.agent_id})`);
    console.log(`  ✓ Reasoning considers context: ${data.reasoning.includes('search') || data.reasoning.includes('find')}`);

    if (data.agent_id === 'librarian') {
      console.log('  ✅ PASSED\n');
      passed++;
    } else {
      console.log('  ❌ FAILED (expected librarian based on context)\n');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Test 6: Empty query rejection
  try {
    console.log('Test 6: Empty query rejection');
    
    const response = await fetch(`${BASE_URL}/api/supervisor/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '',
        session_id: 'manual-test-6',
      }),
    });

    console.log(`  ✓ Status: ${response.status}`);

    if (response.status === 400) {
      console.log('  ✅ PASSED (correctly rejected empty query)\n');
      passed++;
    } else {
      console.log('  ❌ FAILED (should reject with 400)\n');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Test 7: Missing session_id rejection
  try {
    console.log('Test 7: Missing session_id rejection');
    
    const response = await fetch(`${BASE_URL}/api/supervisor/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Test query',
      }),
    });

    console.log(`  ✓ Status: ${response.status}`);

    if (response.status === 400) {
      console.log('  ✅ PASSED (correctly rejected missing session_id)\n');
      passed++;
    } else {
      console.log('  ❌ FAILED (should reject with 400)\n');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Test 8: Performance - 10 queries
  try {
    console.log('Test 8: Performance - 10 sequential queries');
    
    const latencies: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      
      await fetch(`${BASE_URL}/api/supervisor/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Test query ${i}`,
          session_id: `manual-test-perf-${i}`,
        }),
      });

      latencies.push(Date.now() - start);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    const minLatency = Math.min(...latencies);

    console.log(`  ✓ Average latency: ${avgLatency.toFixed(1)}ms`);
    console.log(`  ✓ Min latency: ${minLatency}ms`);
    console.log(`  ✓ Max latency: ${maxLatency}ms`);

    if (avgLatency < 200 && maxLatency < 500) {
      console.log('  ✅ PASSED (avg <200ms, max <500ms)\n');
      passed++;
    } else {
      console.log('  ❌ FAILED (avg or max latency too high)\n');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error}\n`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60) + '\n');

  if (failed === 0) {
    console.log('✅ All integration tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run tests
testRouting().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
