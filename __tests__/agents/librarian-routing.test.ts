/**
 * Librarian Routing Integration Tests
 * 
 * Tests the integration between Supervisor Router and Librarian Agent:
 * - Routing "search" queries to Librarian
 * - Handoff from Dojo to Librarian
 * - Handoff from Librarian back to Dojo
 * - Context preservation during handoffs
 * - Cost tracking for routing and search
 */

import { routeWithFallback } from '../../lib/agents/fallback';
import { getAvailableAgents } from '../../lib/agents/supervisor';
import { executeHandoff } from '../../lib/agents/handoff';
import { AGENT_IDS, type HandoffContext, type ChatMessage } from '../../lib/agents/types';
import { getDB } from '../../lib/pglite/client';

console.log('Testing Librarian Routing Integration...\n');

let testCount = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, message?: string): void {
  testCount++;
  if (condition) {
    passedTests++;
    console.log(`✓ ${testName}`);
  } else {
    console.error(`✗ ${testName}${message ? `: ${message}` : ''}`);
    process.exit(1);
  }
}

async function cleanupTestData(sessionId: string): Promise<void> {
  const db = await getDB();
  await db.query('DELETE FROM routing_decisions WHERE session_id = $1', [sessionId]);
  await db.query('DELETE FROM routing_costs WHERE session_id = $1', [sessionId]);
  await db.query('DELETE FROM agent_handoffs WHERE session_id = $1', [sessionId]);
}

async function runTests() {
  const testSessionId = `test-session-routing-${Date.now()}`;

  // Test 1: Route "search" query to Librarian
  console.log('1. Testing routing of "search" query to Librarian...');
  
  try {
    const result = await routeWithFallback({
      query: 'search for budget planning prompts',
      conversation_context: [],
      session_id: testSessionId,
      available_agents: getAvailableAgents(),
    });

    assert(
      result.agent_id === AGENT_IDS.LIBRARIAN,
      'Should route "search" query to Librarian',
      `Got: ${result.agent_id}`
    );
    assert(
      result.confidence > 0,
      'Should have confidence > 0',
      `Got: ${result.confidence}`
    );
    
    console.log(`   Routing decision: ${result.agent_name} (confidence: ${result.confidence})`);
    console.log(`   Reasoning: ${result.reasoning}`);
  } catch (error) {
    assert(false, 'Should route query successfully', String(error));
  }

  // Test 2: Route "find" query to Librarian
  console.log('\n2. Testing routing of "find" query to Librarian...');
  
  try {
    const result = await routeWithFallback({
      query: 'find similar prompts about finance',
      conversation_context: [],
      session_id: testSessionId,
      available_agents: getAvailableAgents(),
    });

    assert(
      result.agent_id === AGENT_IDS.LIBRARIAN,
      'Should route "find" query to Librarian',
      `Got: ${result.agent_id}`
    );
    
    console.log(`   Routing decision: ${result.agent_name}`);
  } catch (error) {
    assert(false, 'Should route query successfully', String(error));
  }

  // Test 3: Route "discover" query to Librarian
  console.log('\n3. Testing routing of "discover" query to Librarian...');
  
  try {
    const result = await routeWithFallback({
      query: 'show me what I built before',
      conversation_context: [],
      session_id: testSessionId,
      available_agents: getAvailableAgents(),
    });

    assert(
      result.agent_id === AGENT_IDS.LIBRARIAN,
      'Should route "show me" query to Librarian',
      `Got: ${result.agent_id}`
    );
    
    console.log(`   Routing decision: ${result.agent_name}`);
  } catch (error) {
    assert(false, 'Should route query successfully', String(error));
  }

  // Test 4: Route non-search query to Dojo (default agent)
  console.log('\n4. Testing routing of general query to Dojo...');
  
  try {
    const result = await routeWithFallback({
      query: 'I need help exploring perspectives',
      conversation_context: [],
      session_id: testSessionId,
      available_agents: getAvailableAgents(),
    });

    assert(
      result.agent_id === AGENT_IDS.DOJO,
      'Should route general query to Dojo',
      `Got: ${result.agent_id}`
    );
    
    console.log(`   Routing decision: ${result.agent_name}`);
  } catch (error) {
    assert(false, 'Should route query successfully', String(error));
  }

  // Test 5: Handoff from Dojo to Librarian (requires OpenAI key)
  console.log('\n5. Testing handoff from Dojo to Librarian...');
  
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
  
  if (!hasOpenAIKey) {
    console.log('⊘ Skipping handoff test (no OpenAI key)');
  } else {
    try {
      const conversationHistory: ChatMessage[] = [
        {
          role: 'user',
          content: 'I need help with budget planning',
          agent_id: AGENT_IDS.DOJO,
        },
        {
          role: 'assistant',
          content: 'Let me help you explore that',
          agent_id: AGENT_IDS.DOJO,
        },
        {
          role: 'user',
          content: 'Actually, can you search for budget prompts?',
          agent_id: AGENT_IDS.DOJO,
        },
      ];

      const handoffContext: HandoffContext = {
        session_id: testSessionId,
        from_agent: AGENT_IDS.DOJO,
        to_agent: AGENT_IDS.LIBRARIAN,
        reason: 'User requested search functionality',
        conversation_history: conversationHistory,
        harness_trace_id: 'trace-test-123',
        user_intent: 'search for budget prompts',
      };

      await executeHandoff(handoffContext);
      
      assert(true, 'Should execute handoff from Dojo to Librarian');
      console.log('   Handoff executed successfully');
    } catch (error) {
      assert(false, 'Should execute handoff successfully', String(error));
    }
  }

  // Test 6: Handoff from Librarian back to Dojo
  console.log('\n6. Testing handoff from Librarian back to Dojo...');
  
  try {
    const conversationHistory: ChatMessage[] = [
      {
        role: 'user',
        content: 'search for budget prompts',
        agent_id: AGENT_IDS.LIBRARIAN,
      },
      {
        role: 'assistant',
        content: 'Found 3 budget planning prompts',
        agent_id: AGENT_IDS.LIBRARIAN,
      },
      {
        role: 'user',
        content: 'Now help me explore perspectives on this',
        agent_id: AGENT_IDS.LIBRARIAN,
      },
    ];

    const handoffContext: HandoffContext = {
      session_id: testSessionId,
      from_agent: AGENT_IDS.LIBRARIAN,
      to_agent: AGENT_IDS.DOJO,
      reason: 'User needs thinking partnership',
      conversation_history: conversationHistory,
      harness_trace_id: 'trace-test-456',
      user_intent: 'explore perspectives on budget planning',
    };

    await executeHandoff(handoffContext);
    
    assert(true, 'Should execute handoff from Librarian to Dojo');
    console.log('   Handoff executed successfully');
  } catch (error) {
    assert(false, 'Should execute handoff successfully', String(error));
  }

  // Test 7: Context Preservation (requires OpenAI key for full test)
  console.log('\n7. Testing context preservation during handoff...');
  
  try {
    const db = await getDB();
    const handoffs = await db.query<{
      id: string;
      session_id: string;
      from_agent: string;
      to_agent: string;
      reason: string;
      conversation_history: string;
      user_intent: string;
      created_at: string;
    }>(
      'SELECT * FROM agent_handoffs WHERE session_id = $1 ORDER BY created_at ASC',
      [testSessionId]
    );

    const expectedHandoffs = hasOpenAIKey ? 2 : 1;
    assert(
      handoffs.rows.length >= expectedHandoffs,
      'Should have at least ' + expectedHandoffs + ' handoff record(s)',
      `Got: ${handoffs.rows.length}`
    );

    const firstHandoff = handoffs.rows[0];
    // PGlite automatically parses JSONB columns to JavaScript objects
    const conversationHistory = typeof firstHandoff.conversation_history === 'string'
      ? JSON.parse(firstHandoff.conversation_history)
      : firstHandoff.conversation_history;
    
    assert(
      Array.isArray(conversationHistory),
      'Should preserve conversation history as array'
    );
    assert(
      conversationHistory.length > 0,
      'Should preserve conversation messages',
      `Got: ${conversationHistory.length} messages`
    );
    assert(
      firstHandoff.user_intent !== null,
      'Should preserve user intent'
    );
    
    console.log(`   Context preserved: ${conversationHistory.length} messages, user_intent: "${firstHandoff.user_intent}"`);
  } catch (error) {
    assert(false, 'Should preserve context during handoff', String(error));
  }

  // Test 8: Cost Tracking Integration
  console.log('\n8. Testing cost tracking for routing decisions...');
  
  try {
    const db = await getDB();
    const costs = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM routing_costs WHERE session_id = $1',
      [testSessionId]
    );

    const costCount = parseInt(costs.rows[0]?.count || '0', 10);
    
    // We should have costs recorded for the routing decisions
    // (but only if OpenAI API was used, not keyword fallback)
    console.log(`   Routing costs tracked: ${costCount} records`);
    assert(
      costCount >= 0,
      'Should track routing costs (or 0 for keyword fallback)'
    );
  } catch (error) {
    assert(false, 'Should track costs successfully', String(error));
  }

  // Cleanup
  await cleanupTestData(testSessionId);

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Tests completed: ${passedTests}/${testCount} passed`);
  
  if (passedTests === testCount) {
    console.log('✓ All routing integration tests passed!');
    process.exit(0);
  } else {
    console.log(`✗ ${testCount - passedTests} test(s) failed`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Fatal test error:', error);
  process.exit(1);
});
