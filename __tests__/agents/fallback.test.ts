import {
  routeWithFallback,
  FallbackReason,
} from '../../lib/agents/fallback';
import {
  RoutingContext,
  RoutingDecision,
  AGENT_IDS,
} from '../../lib/agents/types';
import { getAvailableAgents, getDefaultAgent } from '../../lib/agents/supervisor';

console.log('Testing Fallback Logic...\n');

const defaultAgent = getDefaultAgent();
const availableAgents = getAvailableAgents();
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

async function runTests() {
  // Test 1: Never throws errors
  console.log('1. Testing routeWithFallback never throws errors...');
  try {
    const context: RoutingContext = {
      query: 'test query',
      conversation_context: [],
      session_id: 'test-session',
      available_agents: availableAgents,
    };
    const decision = await routeWithFallback(context);
    assert(decision !== undefined, 'Should return a decision');
  } catch (error) {
    assert(false, 'Should never throw errors', String(error));
  }

  // Test 2: Always returns valid agent ID
  console.log('\n2. Testing routeWithFallback always returns valid agent ID...');
  const context1: RoutingContext = {
    query: 'test query',
    conversation_context: [],
    session_id: 'test-session',
    available_agents: availableAgents,
  };
  const decision1 = await routeWithFallback(context1);
  assert(decision1.agent_id !== undefined, 'Agent ID should be defined');
  assert(typeof decision1.agent_id === 'string', 'Agent ID should be a string');
  assert(decision1.agent_id.length > 0, 'Agent ID should not be empty');

  // Test 3: Empty query returns default agent
  console.log('\n3. Testing empty query returns default agent (Dojo)...');
  const context2: RoutingContext = {
    query: '',
    conversation_context: [],
    session_id: 'test-session',
    available_agents: availableAgents,
  };
  const decision2 = await routeWithFallback(context2);
  assert(decision2.agent_id === AGENT_IDS.DOJO, 'Empty query should route to Dojo');
  assert(decision2.fallback === true, 'Should be marked as fallback');
  assert(decision2.reasoning.includes('Empty query'), 'Reasoning should mention empty query');

  // Test 4: Whitespace-only query
  console.log('\n4. Testing whitespace-only query...');
  const context3: RoutingContext = {
    query: '   ',
    conversation_context: [],
    session_id: 'test-session',
    available_agents: availableAgents,
  };
  const decision3 = await routeWithFallback(context3);
  assert(decision3.agent_id === AGENT_IDS.DOJO, 'Whitespace query should route to Dojo');
  assert(decision3.fallback === true, 'Should be marked as fallback');

  // Test 5: Missing available_agents
  console.log('\n5. Testing missing available_agents (should load from registry)...');
  const context4: RoutingContext = {
    query: 'test query',
    conversation_context: [],
    session_id: 'test-session',
    available_agents: [],
  };
  const decision4 = await routeWithFallback(context4);
  assert(decision4.agent_id !== undefined, 'Should load agents from registry');
  assert(decision4.agent_name !== undefined, 'Should have agent name');

  // Test 6: Search query (keyword fallback)
  console.log('\n6. Testing search query routing...');
  const context5: RoutingContext = {
    query: 'Find prompts similar to my budget planning',
    conversation_context: [],
    session_id: 'test-session',
    available_agents: availableAgents,
  };
  const decision5 = await routeWithFallback(context5);
  const validAgents = [AGENT_IDS.DOJO, AGENT_IDS.LIBRARIAN];
  assert(
    validAgents.includes(decision5.agent_id),
    'Search query should route to Librarian or Dojo'
  );

  // Test 7: Conflict query (keyword fallback)
  console.log('\n7. Testing conflict query routing...');
  const context6: RoutingContext = {
    query: 'I have conflicting perspectives that need resolution',
    conversation_context: [],
    session_id: 'test-session',
    available_agents: availableAgents,
  };
  const decision6 = await routeWithFallback(context6);
  const validDebugAgents = [AGENT_IDS.DOJO, AGENT_IDS.DEBUGGER];
  assert(
    validDebugAgents.includes(decision6.agent_id),
    'Conflict query should route to Debugger or Dojo'
  );

  // Test 8: Confidence score
  console.log('\n8. Testing confidence score...');
  const context7: RoutingContext = {
    query: 'test query',
    conversation_context: [],
    session_id: 'test-session',
    available_agents: availableAgents,
  };
  const decision7 = await routeWithFallback(context7);
  assert(decision7.confidence !== undefined, 'Should have confidence score');
  assert(typeof decision7.confidence === 'number', 'Confidence should be a number');
  assert(decision7.confidence >= 0 && decision7.confidence <= 1, 'Confidence should be 0-1');

  // Test 9: Reasoning
  console.log('\n9. Testing reasoning...');
  assert(decision7.reasoning !== undefined, 'Should have reasoning');
  assert(typeof decision7.reasoning === 'string', 'Reasoning should be a string');
  assert(decision7.reasoning.length > 0, 'Reasoning should not be empty');

  // Test 10: Agent name
  console.log('\n10. Testing agent name...');
  assert(decision7.agent_name !== undefined, 'Should have agent name');
  assert(typeof decision7.agent_name === 'string', 'Agent name should be a string');
  assert(decision7.agent_name!.length > 0, 'Agent name should not be empty');

  // Test 11: Very long query
  console.log('\n11. Testing very long query...');
  const context8: RoutingContext = {
    query: 'a'.repeat(10000),
    conversation_context: [],
    session_id: 'test-session',
    available_agents: availableAgents,
  };
  const decision8 = await routeWithFallback(context8);
  const allAgents = [AGENT_IDS.DOJO, AGENT_IDS.LIBRARIAN, AGENT_IDS.DEBUGGER];
  assert(allAgents.includes(decision8.agent_id), 'Should handle very long queries');

  // Test 12: Long conversation context
  console.log('\n12. Testing long conversation context...');
  const context9: RoutingContext = {
    query: 'test query',
    conversation_context: Array(100).fill('Previous message'),
    session_id: 'test-session',
    available_agents: availableAgents,
  };
  const decision9 = await routeWithFallback(context9);
  assert(decision9.agent_id !== undefined, 'Should handle long conversation context');

  // Test 13: Special characters
  console.log('\n13. Testing special characters in query...');
  const context10: RoutingContext = {
    query: 'test @#$%^&*() query with 🚀 emoji',
    conversation_context: [],
    session_id: 'test-session',
    available_agents: availableAgents,
  };
  const decision10 = await routeWithFallback(context10);
  assert(decision10.agent_id !== undefined, 'Should handle special characters');

  // Test 14: Performance (dev mode should be fast)
  console.log('\n14. Testing performance (<1 second for dev mode)...');
  const context11: RoutingContext = {
    query: 'test query',
    conversation_context: [],
    session_id: 'test-session',
    available_agents: availableAgents,
  };
  const startTime = Date.now();
  await routeWithFallback(context11);
  const endTime = Date.now();
  const duration = endTime - startTime;
  assert(duration < 1000, 'Should complete in <1 second', `took ${duration}ms`);

  // Test 15: Invalid session_id
  console.log('\n15. Testing invalid session_id...');
  const context12: RoutingContext = {
    query: 'test query',
    conversation_context: [],
    session_id: '',
    available_agents: availableAgents,
  };
  const decision12 = await routeWithFallback(context12);
  assert(decision12.agent_id !== undefined, 'Should handle invalid session_id');

  // Test 16: Mixed intent query
  console.log('\n16. Testing mixed intent query...');
  const context13: RoutingContext = {
    query: 'search for conflicts and debug errors',
    conversation_context: [],
    session_id: 'test-session',
    available_agents: availableAgents,
  };
  const decision13 = await routeWithFallback(context13);
  assert(allAgents.includes(decision13.agent_id), 'Should handle mixed intent');

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Tests completed: ${passedTests}/${testCount} passed`);
  console.log(`${'='.repeat(50)}`);

  if (passedTests === testCount) {
    console.log('\n✓ All fallback logic tests passed!');
    process.exit(0);
  } else {
    console.error(`\n✗ ${testCount - passedTests} test(s) failed`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('\n✗ Test execution failed:', error);
  process.exit(1);
});
