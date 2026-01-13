import {
  executeHandoff,
  storeHandoffEvent,
  getHandoffHistory,
  getLastHandoff,
  getHandoffCount,
} from '../../lib/agents/handoff';
import {
  HandoffContext,
  HandoffError,
  ChatMessage,
  AGENT_IDS,
} from '../../lib/agents/types';
import { getDB } from '../../lib/pglite/client';

export async function runHandoffTests(): Promise<string[]> {
  const results: string[] = [];
  let testCount = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, message?: string): void {
    testCount++;
    if (condition) {
      passedTests++;
      results.push(`✓ ${testName}`);
    } else {
      results.push(`✗ ${testName}`);
      if (message) {
        results.push(`  ${message}`);
      }
    }
  }

  const testSessionId = `test-session-${Date.now()}`;
  const conversationHistory: ChatMessage[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: 'I want to explore perspectives',
      timestamp: new Date().toISOString(),
      agent_id: AGENT_IDS.DOJO,
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'Let me help you explore different perspectives',
      timestamp: new Date().toISOString(),
      agent_id: AGENT_IDS.DOJO,
    },
  ];

  try {
    // Test 1: Store handoff event
    results.push('\nTesting storeHandoffEvent()');
    const context: HandoffContext = {
      session_id: testSessionId,
      from_agent: AGENT_IDS.DOJO,
      to_agent: AGENT_IDS.LIBRARIAN,
      reason: 'User wants to search for information',
      conversation_history: conversationHistory,
      harness_trace_id: 'trace-123',
      user_intent: 'Search for previous prompts',
    };

    const handoffId = await storeHandoffEvent(context);
    assert(typeof handoffId === 'string', 'Should return handoff ID');
    assert(handoffId.length > 0, 'Handoff ID should not be empty');

    // Test 2: Retrieve handoff history
    results.push('\nTesting getHandoffHistory()');
    const history = await getHandoffHistory(testSessionId);
    assert(Array.isArray(history), 'Should return array');
    assert(history.length === 1, 'Should have 1 handoff event');
    assert(history[0].session_id === testSessionId, 'Session ID should match');
    assert(history[0].from_agent === AGENT_IDS.DOJO, 'from_agent should be dojo');
    assert(history[0].to_agent === AGENT_IDS.LIBRARIAN, 'to_agent should be librarian');

    // Test 3: Get last handoff
    results.push('\nTesting getLastHandoff()');
    const lastHandoff = await getLastHandoff(testSessionId);
    assert(lastHandoff !== null, 'Should return last handoff');
    assert(lastHandoff!.from_agent === AGENT_IDS.DOJO, 'from_agent should be dojo');

    // Test 4: Get handoff count
    results.push('\nTesting getHandoffCount()');
    const totalCount = await getHandoffCount(testSessionId);
    assert(totalCount === 1, 'Should have 1 total handoff');

    // Test 5: Multiple handoffs
    results.push('\nTesting multiple handoffs');
    const context2: HandoffContext = {
      session_id: testSessionId,
      from_agent: AGENT_IDS.LIBRARIAN,
      to_agent: AGENT_IDS.DOJO,
      reason: 'Search complete',
      conversation_history: conversationHistory,
      user_intent: 'Continue exploring',
    };

    await storeHandoffEvent(context2);
    const history2 = await getHandoffHistory(testSessionId);
    assert(history2.length === 2, 'Should have 2 handoff events');

    const lastHandoff2 = await getLastHandoff(testSessionId);
    assert(lastHandoff2!.from_agent === AGENT_IDS.LIBRARIAN, 'Last handoff should be from librarian');

    // Test 6: Validation - same agent
    results.push('\nTesting validation');
    try {
      const invalidContext: HandoffContext = {
        session_id: testSessionId,
        from_agent: AGENT_IDS.DOJO,
        to_agent: AGENT_IDS.DOJO,
        reason: 'Test',
        conversation_history: [],
        user_intent: 'Test',
      };

      await executeHandoff(invalidContext);
      assert(false, 'Should throw error for same agent');
    } catch (error) {
      assert(error instanceof HandoffError, 'Should throw HandoffError');
    }

    // Test 7: Validation - missing fields
    try {
      const invalidContext: HandoffContext = {
        session_id: '',
        from_agent: AGENT_IDS.DOJO,
        to_agent: AGENT_IDS.LIBRARIAN,
        reason: 'Test',
        conversation_history: [],
        user_intent: 'Test',
      };

      await executeHandoff(invalidContext);
      assert(false, 'Should throw error for missing session_id');
    } catch (error) {
      assert(error instanceof HandoffError, 'Should throw HandoffError for missing session_id');
    }

    // Cleanup
    const db = await getDB();
    await db.query('DELETE FROM agent_handoffs WHERE session_id = $1', [testSessionId]);

  } catch (error) {
    assert(false, 'Test suite failed', String(error));
  }

  results.push(`\n==================================================`);
  results.push(`Tests completed: ${passedTests}/${testCount} passed`);
  results.push(`==================================================`);

  return results;
}
