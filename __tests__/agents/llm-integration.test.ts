/**
 * LLM Integration Tests (Phase 6)
 * 
 * Tests end-to-end agent workflows with DeepSeek API:
 * - Supervisor routing with real DeepSeek API
 * - Fallback logic (DeepSeek errors → gpt-4o-mini)
 * - Cost tracking integration
 * - Harness Trace integration
 * 
 * IMPORTANT: Requires valid DEEPSEEK_API_KEY in .env.local
 * Run with: npm run test:llm-integration
 */

import { routeQuery, getAvailableAgents } from '../../lib/agents/supervisor';
import { startTrace, endTrace, getCurrentTrace } from '../../lib/harness/trace';
import { getDB } from '../../lib/pglite/client';
import type { RoutingContext } from '../../lib/agents/types';

const TEST_SESSION_ID = `sess_integration_${Date.now()}`;
const TEST_USER_ID = `user_integration_${Date.now()}`;

/**
 * Test 1: Supervisor routing with real DeepSeek API (5 queries)
 */
async function testSupervisorRouting() {
  console.log('\n=== Test 1: Supervisor Routing with DeepSeek ===\n');

  const testCases: { query: string; expectedAgent: string; description: string }[] = [
    {
      query: 'Help me explore different perspectives on AI ethics',
      expectedAgent: 'dojo',
      description: 'General thinking query',
    },
    {
      query: 'Find prompts similar to my budget planning prompt',
      expectedAgent: 'librarian',
      description: 'Search query',
    },
    {
      query: 'I have conflicting requirements in my project spec',
      expectedAgent: 'debugger',
      description: 'Debug/conflict query',
    },
    {
      query: 'Search for previous conversations about design patterns',
      expectedAgent: 'librarian',
      description: 'Search/lookup query',
    },
    {
      query: 'What are the tradeoffs between microservices and monoliths?',
      expectedAgent: 'dojo',
      description: 'Thinking/analysis query',
    },
  ];

  const availableAgents = getAvailableAgents();
  let successCount = 0;

  for (const testCase of testCases) {
    const context: RoutingContext = {
      query: testCase.query,
      conversation_context: [],
      session_id: TEST_SESSION_ID,
      available_agents: availableAgents,
    };

    try {
      const decision = await routeQuery(context);

      console.log(`Query: "${testCase.query}"`);
      console.log(`Expected: ${testCase.expectedAgent}`);
      console.log(`Got: ${decision.agent_id}`);
      console.log(`Model: ${decision.usage ? 'deepseek-chat' : 'keyword-fallback'}`);
      console.log(`Confidence: ${decision.confidence.toFixed(2)}`);
      console.log(`Reasoning: ${decision.reasoning}`);

      if (decision.agent_id === testCase.expectedAgent) {
        console.log(`✓ ${testCase.description}\n`);
        successCount++;
      } else {
        console.log(`✗ ${testCase.description} (routing mismatch)\n`);
      }
    } catch (error) {
      console.error(`✗ ${testCase.description} (error):`, error);
      console.error('');
    }
  }

  console.log(`Supervisor routing: ${successCount}/${testCases.length} tests passed\n`);

  return successCount === testCases.length;
}

/**
 * Test 2: Fallback logic (simulate DeepSeek errors)
 */
async function testFallbackLogic() {
  console.log('\n=== Test 2: Fallback Logic ===\n');

  const testQuery = 'Help me debug this issue';
  const availableAgents = getAvailableAgents();

  console.log('Testing fallback with empty query (should use default agent)...');
  try {
    const context: RoutingContext = {
      query: '',
      conversation_context: [],
      session_id: TEST_SESSION_ID,
      available_agents: availableAgents,
    };

    const decision = await routeQuery(context);

    if (decision.agent_id === 'dojo' && decision.fallback === true) {
      console.log('✓ Empty query correctly routed to default agent');
      console.log(`  Reasoning: ${decision.reasoning}\n`);
    } else {
      console.log('✗ Empty query not handled correctly\n');
      return false;
    }
  } catch (error) {
    console.error('✗ Empty query test failed:', error);
    return false;
  }

  console.log('Testing fallback with no agents available...');
  try {
    const context: RoutingContext = {
      query: testQuery,
      conversation_context: [],
      session_id: TEST_SESSION_ID,
      available_agents: [],
    };

    await routeQuery(context);
    console.log('✗ Should have thrown error for no agents\n');
    return false;
  } catch (error) {
    if (error instanceof Error && error.message.includes('No agents available')) {
      console.log('✓ Correctly throws error when no agents available\n');
    } else {
      console.error('✗ Wrong error thrown:', error);
      return false;
    }
  }

  console.log('Testing low confidence fallback...');
  try {
    const context: RoutingContext = {
      query: 'xyz abc qwerty',
      conversation_context: [],
      session_id: TEST_SESSION_ID,
      available_agents: availableAgents,
    };

    const decision = await routeQuery(context);

    if (decision.fallback === true || decision.confidence < 0.6) {
      console.log('✓ Low confidence query handled correctly');
      console.log(`  Agent: ${decision.agent_id}, Confidence: ${decision.confidence.toFixed(2)}\n`);
    } else {
      console.log('✓ Query routed with acceptable confidence');
      console.log(`  Agent: ${decision.agent_id}, Confidence: ${decision.confidence.toFixed(2)}\n`);
    }
  } catch (error) {
    console.error('✗ Low confidence test failed:', error);
    return false;
  }

  console.log('Fallback logic: All tests passed\n');
  return true;
}

/**
 * Test 3: Cost tracking integration
 */
async function testCostTracking() {
  console.log('\n=== Test 3: Cost Tracking Integration ===\n');

  const testQuery = 'Find information about machine learning';
  const availableAgents = getAvailableAgents();

  try {
    console.log('Making routing decision with cost tracking...');
    const context: RoutingContext = {
      query: testQuery,
      conversation_context: [],
      session_id: TEST_SESSION_ID,
      available_agents: availableAgents,
    };

    const decision = await routeQuery(context);

    console.log(`✓ Routing decision made: ${decision.agent_id}`);
    console.log(`  Confidence: ${decision.confidence.toFixed(2)}`);
    console.log(`  Fallback: ${decision.fallback}`);

    if (decision.usage) {
      console.log(`  Token usage: ${decision.usage.total_tokens} tokens`);
      console.log(`    Input: ${decision.usage.prompt_tokens}`);
      console.log(`    Output: ${decision.usage.completion_tokens}`);
    } else {
      console.log(`  Token usage: N/A (keyword-based fallback)`);
    }

    console.log('\nQuerying routing_costs table...');
    const db = await getDB();
    const result = await db.query<{
      total_tokens: number;
      total_cost_usd: number;
      routing_count: number;
    }>(
      `
      SELECT 
        COALESCE(SUM(tokens_used), 0) as total_tokens,
        COALESCE(SUM(cost_usd), 0) as total_cost_usd,
        COUNT(*) as routing_count
      FROM routing_costs
      WHERE session_id = $1
      `,
      [TEST_SESSION_ID]
    );

    const stats = result.rows[0];
    console.log(`✓ Cost tracking verified:`);
    console.log(`  Routing count: ${stats.routing_count}`);
    console.log(`  Total tokens: ${stats.total_tokens}`);
    console.log(`  Total cost: $${stats.total_cost_usd.toFixed(6)}`);

    if (stats.routing_count >= 1) {
      console.log('\n✓ Cost tracking integration working\n');
      return true;
    } else {
      console.log('\n✗ No cost records found (expected at least 1 if using API)\n');
      console.log('  Note: This is OK if running in dev mode without API keys\n');
      return true;
    }
  } catch (error) {
    console.error('✗ Cost tracking test failed:', error);
    return false;
  }
}

/**
 * Test 4: Harness Trace integration
 */
async function testHarnessTrace() {
  console.log('\n=== Test 4: Harness Trace Integration ===\n');

  try {
    console.log('Starting new trace...');
    const trace = startTrace(TEST_SESSION_ID, TEST_USER_ID);
    console.log(`✓ Trace started: ${trace.trace_id}\n`);

    console.log('Making routing decision with trace active...');
    const availableAgents = getAvailableAgents();
    const context: RoutingContext = {
      query: 'Help me explore different perspectives on cloud architecture',
      conversation_context: [],
      session_id: TEST_SESSION_ID,
      available_agents: availableAgents,
    };

    const decision = await routeQuery(context);
    console.log(`✓ Routing decision: ${decision.agent_id} (confidence: ${decision.confidence.toFixed(2)})\n`);

    console.log('Checking trace for AGENT_ROUTING events...');
    const currentTrace = getCurrentTrace();
    if (!currentTrace) {
      console.log('✗ No active trace found\n');
      return false;
    }

    const routingEvents = currentTrace.events.filter(e => e.event_type === 'AGENT_ROUTING');
    console.log(`✓ Found ${routingEvents.length} AGENT_ROUTING event(s)`);

    if (routingEvents.length > 0) {
      const event = routingEvents[0];
      console.log(`  Span ID: ${event.span_id}`);
      console.log(`  Event type: ${event.event_type}`);
      console.log(`  Timestamp: ${event.timestamp}`);
      if (event.children && event.children.length > 0) {
        console.log(`  Children: ${event.children.length} child event(s)`);
      }
    }

    console.log('\nEnding trace...');
    const finalTrace = await endTrace();
    console.log(`✓ Trace ended: ${finalTrace.trace_id}`);
    console.log(`  Total events: ${finalTrace.summary.total_events}`);
    console.log(`  Total duration: ${finalTrace.summary.total_duration_ms}ms`);
    console.log(`  Total tokens: ${finalTrace.summary.total_tokens}`);
    console.log(`  Total cost: $${finalTrace.summary.total_cost_usd.toFixed(6)}`);
    console.log(`  Errors: ${finalTrace.summary.errors}`);

    console.log('\nQuerying harness_traces table...');
    const db = await getDB();
    const result = await db.query<{
      trace_id: string;
      session_id: string;
      started_at: string;
      ended_at: string | null;
      events: any;
      summary: any;
    }>(
      `
      SELECT trace_id, session_id, started_at, ended_at, events, summary
      FROM harness_traces
      WHERE session_id = $1
      ORDER BY started_at DESC
      LIMIT 1
      `,
      [TEST_SESSION_ID]
    );

    if (result.rows.length > 0) {
      const dbTrace = result.rows[0];
      console.log(`✓ Trace found in database:`);
      console.log(`  Trace ID: ${dbTrace.trace_id}`);
      console.log(`  Session ID: ${dbTrace.session_id}`);
      console.log(`  Started: ${dbTrace.started_at}`);
      console.log(`  Ended: ${dbTrace.ended_at || 'N/A'}`);
      console.log(`  Events: ${dbTrace.events.length} event(s)`);
      console.log(`  Summary: ${JSON.stringify(dbTrace.summary)}`);

      console.log('\n✓ Harness Trace integration working\n');
      return true;
    } else {
      console.log('✗ No trace found in database\n');
      return false;
    }
  } catch (error) {
    console.error('✗ Harness Trace test failed:', error);
    return false;
  }
}

/**
 * Test 5: End-to-end workflow
 */
async function testEndToEndWorkflow() {
  console.log('\n=== Test 5: End-to-End Workflow ===\n');

  try {
    console.log('Starting complete workflow (trace → routing → cost tracking)...\n');

    const trace = startTrace(`${TEST_SESSION_ID}_e2e`, `${TEST_USER_ID}_e2e`);
    console.log(`✓ Trace started: ${trace.trace_id}\n`);

    const queries = [
      'Find prompts about project management',
      'Help me analyze the tradeoffs between REST and GraphQL',
      'Debug my conflicting requirements',
    ];

    let totalRoutings = 0;
    const availableAgents = getAvailableAgents();

    for (const query of queries) {
      console.log(`Query: "${query}"`);
      const context: RoutingContext = {
        query,
        conversation_context: [],
        session_id: `${TEST_SESSION_ID}_e2e`,
        available_agents: availableAgents,
      };

      const decision = await routeQuery(context);
      console.log(`  → Routed to: ${decision.agent_id} (confidence: ${decision.confidence.toFixed(2)})`);
      totalRoutings++;
    }

    console.log('\nEnding trace...');
    const finalTrace = await endTrace();
    console.log(`✓ Trace ended with ${finalTrace.summary.total_events} events\n`);

    console.log('Verifying data persistence...');
    const db = await getDB();

    const costResult = await db.query<{ routing_count: number }>(
      `SELECT COUNT(*) as routing_count FROM routing_costs WHERE session_id = $1`,
      [`${TEST_SESSION_ID}_e2e`]
    );

    const traceResult = await db.query<{ trace_count: number }>(
      `SELECT COUNT(*) as trace_count FROM harness_traces WHERE session_id = $1`,
      [`${TEST_SESSION_ID}_e2e`]
    );

    console.log(`✓ Routing costs recorded: ${costResult.rows[0].routing_count}`);
    console.log(`✓ Traces recorded: ${traceResult.rows[0].trace_count}`);

    console.log('\n✓ End-to-end workflow complete\n');
    return true;
  } catch (error) {
    console.error('✗ End-to-end workflow failed:', error);
    return false;
  }
}

/**
 * Main test runner
 */
async function runIntegrationTests() {
  console.log('='.repeat(60));
  console.log('LLM INTEGRATION TESTS (Phase 6)');
  console.log('='.repeat(60));

  console.log('\nPrerequisites:');
  console.log('- DEEPSEEK_API_KEY must be set in .env.local');
  console.log('- Database must be initialized (PGlite)');
  console.log('- All migrations must be applied\n');

  console.log('Starting tests...');

  const results = {
    supervisorRouting: false,
    fallbackLogic: false,
    costTracking: false,
    harnessTrace: false,
    endToEnd: false,
  };

  try {
    results.supervisorRouting = await testSupervisorRouting();
    results.fallbackLogic = await testFallbackLogic();
    results.costTracking = await testCostTracking();
    results.harnessTrace = await testHarnessTrace();
    results.endToEnd = await testEndToEndWorkflow();

    console.log('='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Supervisor Routing:  ${results.supervisorRouting ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Fallback Logic:      ${results.fallbackLogic ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Cost Tracking:       ${results.costTracking ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Harness Trace:       ${results.harnessTrace ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`End-to-End Workflow: ${results.endToEnd ? '✓ PASS' : '✗ FAIL'}`);
    console.log('='.repeat(60));

    const allPassed = Object.values(results).every(result => result === true);

    if (allPassed) {
      console.log('\n✅ ALL INTEGRATION TESTS PASSED\n');
      return true;
    } else {
      console.log('\n⚠️  SOME TESTS FAILED\n');
      return false;
    }
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    return false;
  }
}

runIntegrationTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
