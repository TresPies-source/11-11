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

console.log('Testing Handoff System...\n');

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
  await db.query('DELETE FROM agent_handoffs WHERE session_id = $1', [sessionId]);
}

async function runTests() {
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

  console.log('1. Testing storeHandoffEvent()...');
  try {
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
  } catch (error) {
    assert(false, 'Should store handoff event', String(error));
  }

  console.log('\n2. Testing getHandoffHistory()...');
  try {
    const history = await getHandoffHistory(testSessionId);
    assert(Array.isArray(history), 'Should return array');
    assert(history.length === 1, 'Should have 1 handoff event');
    
    const handoff = history[0];
    assert(handoff.session_id === testSessionId, 'Session ID should match');
    assert(handoff.from_agent === AGENT_IDS.DOJO, 'from_agent should be dojo');
    assert(handoff.to_agent === AGENT_IDS.LIBRARIAN, 'to_agent should be librarian');
    assert(handoff.reason === 'User wants to search for information', 'Reason should match');
    assert(Array.isArray(handoff.conversation_history), 'Conversation history should be array');
    assert(handoff.conversation_history.length === 2, 'Should have 2 messages');
    assert(handoff.user_intent === 'Search for previous prompts', 'User intent should match');
  } catch (error) {
    assert(false, 'Should retrieve handoff history', String(error));
  }

  console.log('\n3. Testing getLastHandoff()...');
  try {
    const lastHandoff = await getLastHandoff(testSessionId);
    assert(lastHandoff !== null, 'Should return last handoff');
    assert(lastHandoff!.from_agent === AGENT_IDS.DOJO, 'from_agent should be dojo');
    assert(lastHandoff!.to_agent === AGENT_IDS.LIBRARIAN, 'to_agent should be librarian');
  } catch (error) {
    assert(false, 'Should retrieve last handoff', String(error));
  }

  console.log('\n4. Testing getHandoffCount()...');
  try {
    const totalCount = await getHandoffCount(testSessionId);
    assert(totalCount === 1, 'Should have 1 total handoff');

    const dojoCount = await getHandoffCount(testSessionId, AGENT_IDS.DOJO);
    assert(dojoCount === 1, 'Should have 1 handoff from dojo');

    const librarianCount = await getHandoffCount(testSessionId, undefined, AGENT_IDS.LIBRARIAN);
    assert(librarianCount === 1, 'Should have 1 handoff to librarian');

    const debuggerCount = await getHandoffCount(testSessionId, AGENT_IDS.DEBUGGER);
    assert(debuggerCount === 0, 'Should have 0 handoffs from debugger');
  } catch (error) {
    assert(false, 'Should get handoff counts', String(error));
  }

  console.log('\n5. Testing multiple handoffs...');
  try {
    const context2: HandoffContext = {
      session_id: testSessionId,
      from_agent: AGENT_IDS.LIBRARIAN,
      to_agent: AGENT_IDS.DOJO,
      reason: 'Search complete, returning to thinking partnership',
      conversation_history: [
        ...conversationHistory,
        {
          id: 'msg-3',
          role: 'assistant',
          content: 'I found 3 similar prompts',
          timestamp: new Date().toISOString(),
          agent_id: AGENT_IDS.LIBRARIAN,
        },
      ],
      harness_trace_id: 'trace-124',
      user_intent: 'Continue exploring perspectives',
    };

    await storeHandoffEvent(context2);

    const history = await getHandoffHistory(testSessionId);
    assert(history.length === 2, 'Should have 2 handoff events');
    
    assert(history[0].from_agent === AGENT_IDS.DOJO, 'First handoff from dojo');
    assert(history[1].from_agent === AGENT_IDS.LIBRARIAN, 'Second handoff from librarian');

    const lastHandoff = await getLastHandoff(testSessionId);
    assert(lastHandoff!.from_agent === AGENT_IDS.LIBRARIAN, 'Last handoff should be from librarian');

    const totalCount = await getHandoffCount(testSessionId);
    assert(totalCount === 2, 'Should have 2 total handoffs');
  } catch (error) {
    assert(false, 'Should handle multiple handoffs', String(error));
  }

  console.log('\n6. Testing handoff validation - missing session_id...');
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
    assert(error instanceof HandoffError, 'Should throw HandoffError');
    assert(
      (error as Error).message.includes('session_id'),
      'Error should mention session_id'
    );
  }

  console.log('\n7. Testing handoff validation - missing from_agent...');
  try {
    const invalidContext: HandoffContext = {
      session_id: testSessionId,
      from_agent: '',
      to_agent: AGENT_IDS.LIBRARIAN,
      reason: 'Test',
      conversation_history: [],
      user_intent: 'Test',
    };

    await executeHandoff(invalidContext);
    assert(false, 'Should throw error for missing from_agent');
  } catch (error) {
    assert(error instanceof HandoffError, 'Should throw HandoffError');
    assert(
      (error as Error).message.includes('from_agent'),
      'Error should mention from_agent'
    );
  }

  console.log('\n8. Testing handoff validation - missing to_agent...');
  try {
    const invalidContext: HandoffContext = {
      session_id: testSessionId,
      from_agent: AGENT_IDS.DOJO,
      to_agent: '',
      reason: 'Test',
      conversation_history: [],
      user_intent: 'Test',
    };

    await executeHandoff(invalidContext);
    assert(false, 'Should throw error for missing to_agent');
  } catch (error) {
    assert(error instanceof HandoffError, 'Should throw HandoffError');
    assert(
      (error as Error).message.includes('to_agent'),
      'Error should mention to_agent'
    );
  }

  console.log('\n9. Testing handoff validation - same agent...');
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
    assert(false, 'Should throw error for handoff to same agent');
  } catch (error) {
    assert(error instanceof HandoffError, 'Should throw HandoffError');
    assert(
      (error as Error).message.includes('same agent'),
      'Error should mention same agent'
    );
  }

  console.log('\n10. Testing handoff validation - missing reason...');
  try {
    const invalidContext: HandoffContext = {
      session_id: testSessionId,
      from_agent: AGENT_IDS.DOJO,
      to_agent: AGENT_IDS.LIBRARIAN,
      reason: '',
      conversation_history: [],
      user_intent: 'Test',
    };

    await executeHandoff(invalidContext);
    assert(false, 'Should throw error for missing reason');
  } catch (error) {
    assert(error instanceof HandoffError, 'Should throw HandoffError');
    assert(
      (error as Error).message.includes('reason'),
      'Error should mention reason'
    );
  }

  console.log('\n11. Testing handoff validation - missing user_intent...');
  try {
    const invalidContext: HandoffContext = {
      session_id: testSessionId,
      from_agent: AGENT_IDS.DOJO,
      to_agent: AGENT_IDS.LIBRARIAN,
      reason: 'Test',
      conversation_history: [],
      user_intent: '',
    };

    await executeHandoff(invalidContext);
    assert(false, 'Should throw error for missing user_intent');
  } catch (error) {
    assert(error instanceof HandoffError, 'Should throw HandoffError');
    assert(
      (error as Error).message.includes('user_intent'),
      'Error should mention user_intent'
    );
  }

  console.log('\n12. Testing handoff validation - invalid conversation_history...');
  try {
    const invalidContext = {
      session_id: testSessionId,
      from_agent: AGENT_IDS.DOJO,
      to_agent: AGENT_IDS.LIBRARIAN,
      reason: 'Test',
      conversation_history: 'not an array' as any,
      user_intent: 'Test',
    };

    await executeHandoff(invalidContext);
    assert(false, 'Should throw error for invalid conversation_history');
  } catch (error) {
    assert(error instanceof HandoffError, 'Should throw HandoffError');
    assert(
      (error as Error).message.includes('conversation_history'),
      'Error should mention conversation_history'
    );
  }

  console.log('\n13. Testing handoff validation - invalid from_agent...');
  try {
    const invalidContext: HandoffContext = {
      session_id: testSessionId,
      from_agent: 'invalid_agent',
      to_agent: AGENT_IDS.LIBRARIAN,
      reason: 'Test',
      conversation_history: [],
      user_intent: 'Test',
    };

    await executeHandoff(invalidContext);
    assert(false, 'Should throw error for invalid from_agent');
  } catch (error) {
    assert(error instanceof HandoffError, 'Should throw HandoffError');
    assert(
      (error as Error).message.includes('not available'),
      'Error should mention agent not available'
    );
  }

  console.log('\n14. Testing handoff validation - invalid to_agent...');
  try {
    const invalidContext: HandoffContext = {
      session_id: testSessionId,
      from_agent: AGENT_IDS.DOJO,
      to_agent: 'invalid_agent',
      reason: 'Test',
      conversation_history: [],
      user_intent: 'Test',
    };

    await executeHandoff(invalidContext);
    assert(false, 'Should throw error for invalid to_agent');
  } catch (error) {
    assert(error instanceof HandoffError, 'Should throw HandoffError');
    assert(
      (error as Error).message.includes('not available'),
      'Error should mention agent not available'
    );
  }

  console.log('\n15. Testing conversation history preservation...');
  try {
    const longConversation: ChatMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'First message',
        timestamp: new Date().toISOString(),
        agent_id: AGENT_IDS.DOJO,
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Second message',
        timestamp: new Date().toISOString(),
        agent_id: AGENT_IDS.DOJO,
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'Third message',
        timestamp: new Date().toISOString(),
        agent_id: AGENT_IDS.DOJO,
      },
    ];

    const context: HandoffContext = {
      session_id: testSessionId,
      from_agent: AGENT_IDS.DOJO,
      to_agent: AGENT_IDS.DEBUGGER,
      reason: 'Test conversation preservation',
      conversation_history: longConversation,
      user_intent: 'Test',
    };

    await storeHandoffEvent(context);

    const lastHandoff = await getLastHandoff(testSessionId);
    assert(lastHandoff !== null, 'Should return handoff');
    assert(
      lastHandoff!.conversation_history.length === 3,
      'Should preserve all 3 messages'
    );
    assert(
      lastHandoff!.conversation_history[0].content === 'First message',
      'Should preserve message content'
    );
    assert(
      lastHandoff!.conversation_history[2].content === 'Third message',
      'Should preserve message order'
    );
  } catch (error) {
    assert(false, 'Should preserve conversation history', String(error));
  }

  console.log('\n16. Testing harness_trace_id handling...');
  try {
    const contextWithTrace: HandoffContext = {
      session_id: testSessionId,
      from_agent: AGENT_IDS.DEBUGGER,
      to_agent: AGENT_IDS.DOJO,
      reason: 'Test harness trace',
      conversation_history: [],
      harness_trace_id: 'trace-456',
      user_intent: 'Test',
    };

    await storeHandoffEvent(contextWithTrace);

    const lastHandoff = await getLastHandoff(testSessionId);
    assert(lastHandoff !== null, 'Should return handoff');
    assert(
      lastHandoff!.harness_trace_id === 'trace-456',
      'Should preserve harness trace ID'
    );
  } catch (error) {
    assert(false, 'Should handle harness trace ID', String(error));
  }

  console.log('\n17. Testing handoff without harness_trace_id...');
  try {
    const contextWithoutTrace: HandoffContext = {
      session_id: testSessionId,
      from_agent: AGENT_IDS.LIBRARIAN,
      to_agent: AGENT_IDS.DEBUGGER,
      reason: 'Test without harness trace',
      conversation_history: [],
      user_intent: 'Test',
    };

    await storeHandoffEvent(contextWithoutTrace);

    const lastHandoff = await getLastHandoff(testSessionId);
    assert(lastHandoff !== null, 'Should return handoff');
    assert(
      lastHandoff!.harness_trace_id === null || lastHandoff!.harness_trace_id === undefined,
      'Should handle missing harness trace ID'
    );
  } catch (error) {
    assert(false, 'Should handle missing harness trace ID', String(error));
  }

  console.log('\n18. Testing getHandoffHistory() for non-existent session...');
  try {
    const nonExistentSession = 'non-existent-session';
    const history = await getHandoffHistory(nonExistentSession);
    assert(Array.isArray(history), 'Should return empty array');
    assert(history.length === 0, 'Should have no handoffs');
  } catch (error) {
    assert(false, 'Should handle non-existent session', String(error));
  }

  console.log('\n19. Testing getLastHandoff() for non-existent session...');
  try {
    const nonExistentSession = 'non-existent-session';
    const lastHandoff = await getLastHandoff(nonExistentSession);
    assert(lastHandoff === null, 'Should return null for non-existent session');
  } catch (error) {
    assert(false, 'Should handle non-existent session', String(error));
  }

  console.log('\n20. Testing getHandoffCount() for non-existent session...');
  try {
    const nonExistentSession = 'non-existent-session';
    const count = await getHandoffCount(nonExistentSession);
    assert(count === 0, 'Should return 0 for non-existent session');
  } catch (error) {
    assert(false, 'Should handle non-existent session', String(error));
  }

  await cleanupTestData(testSessionId);

  console.log(`\n✅ All handoff tests passed! (${passedTests}/${testCount})\n`);
}

runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
