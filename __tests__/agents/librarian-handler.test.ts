/**
 * Librarian Handler Tests
 * 
 * Tests the Librarian agent handler functionality including:
 * - Query extraction and processing
 * - Search execution
 * - Cost tracking integration
 * - Proactive suggestions
 * - Response formatting
 */

import {
  handleLibrarianQuery,
  extractSearchQuery,
  formatLibrarianResponse,
  extractConversationContext,
  invokeLibrarianAgent,
  type LibrarianQuery,
} from '../../lib/agents/librarian-handler';
import { AGENT_IDS, type ChatMessage } from '../../lib/agents/types';
import { getDB } from '../../lib/pglite/client';

console.log('Testing Librarian Handler...\n');

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

async function setupTestData(): Promise<void> {
  const db = await getDB();

  const testId1 = '11111111-1111-1111-1111-111111111111';
  const testId2 = '22222222-2222-2222-2222-222222222222';
  const testId3 = '33333333-3333-3333-3333-333333333333';

  // Create test prompts
  await db.query(
    `INSERT INTO prompts (id, user_id, title, content, status, embedding)
     VALUES 
       ($1, 'test-user', 'Budget Planning', 'How to plan a monthly budget', 'active', $4),
       ($2, 'test-user', 'Financial Goals', 'Setting financial goals for 2026', 'active', $5),
       ($3, 'test-user', 'Grocery List', 'Weekly grocery shopping list', 'active', $6)
     ON CONFLICT (id) DO NOTHING`,
    [
      testId1,
      testId2,
      testId3,
      JSON.stringify(Array(1536).fill(0.5)), // Mock embedding
      JSON.stringify(Array(1536).fill(0.4)), // Mock embedding
      JSON.stringify(Array(1536).fill(0.1)), // Mock embedding
    ]
  );

  // Create metadata for test prompts
  await db.query(
    `INSERT INTO prompt_metadata (prompt_id, description, tags)
     VALUES 
       ($1, 'Budget planning guide', ARRAY['finance', 'planning']),
       ($2, 'Financial goals guide', ARRAY['finance', 'goals']),
       ($3, 'Grocery shopping', ARRAY['shopping'])
     ON CONFLICT (prompt_id) DO NOTHING`,
    [testId1, testId2, testId3]
  );
}

async function cleanupTestData(): Promise<void> {
  const db = await getDB();
  await db.query(`DELETE FROM prompts WHERE id::text LIKE 'test-prompt-%'`);
  await db.query(`DELETE FROM search_history WHERE query LIKE 'test-%'`);
}

async function runTests() {
  await setupTestData();

  // Test 1: Extract Search Query
  console.log('1. Testing extractSearchQuery()...');
  
  const queries = [
    { input: 'search for budget planning', expected: 'budget planning' },
    { input: 'find financial goals', expected: 'financial goals' },
    { input: 'show me recent prompts', expected: 'recent prompts' },
    { input: 'retrieve grocery list', expected: 'grocery list' },
    { input: 'look for shopping', expected: 'shopping' },
    { input: 'discover similar prompts', expected: 'similar prompts' },
    { input: 'budget planning', expected: 'budget planning' },
  ];

  for (const { input, expected } of queries) {
    const result = extractSearchQuery(input);
    assert(
      result === expected,
      `Should extract "${expected}" from "${input}"`,
      `Got "${result}"`
    );
  }

  // Test 2: Extract Conversation Context
  console.log('\n2. Testing extractConversationContext()...');
  
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: 'I need help with budget planning',
      agent_id: AGENT_IDS.DOJO,
    },
    {
      role: 'assistant',
      content: 'I can help with that',
      agent_id: AGENT_IDS.DOJO,
    },
    {
      role: 'user',
      content: 'Show me financial prompts',
      agent_id: AGENT_IDS.DOJO,
    },
  ];

  const context = extractConversationContext(messages, 3);
  assert(context !== undefined, 'Should extract context from messages');
  if (context) {
    assert(
      context.includes('budget planning'),
      'Context should include user queries',
      `Got: ${context}`
    );
  }

  // Test 3: Handle Librarian Query (requires OpenAI key)
  console.log('\n3. Testing handleLibrarianQuery()...');
  
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
  
  if (!hasOpenAIKey) {
    console.log('⊘ Skipping search test (no OpenAI key)');
  } else {
    try {
      const query: LibrarianQuery = {
        query: 'search for budget planning',
        conversationContext: messages,
        sessionId: 'test-session-librarian',
        userId: 'test-user',
      };

      const response = await handleLibrarianQuery(query);
      
      assert(
        typeof response === 'object',
        'Should return response object'
      );
      assert(
        response.query === 'budget planning',
        'Should extract clean query',
        `Got: ${response.query}`
      );
      assert(
        Array.isArray(response.results),
        'Should return results array'
      );
      assert(
        typeof response.count === 'number',
        'Should return result count'
      );
      assert(
        typeof response.duration_ms === 'number',
        'Should return duration'
      );
      
      console.log(`   Found ${response.count} results in ${response.duration_ms}ms`);
    } catch (error) {
      assert(
        false,
        'Should handle query successfully',
        String(error)
      );
    }
  }

  // Test 4: Format Librarian Response
  console.log('\n4. Testing formatLibrarianResponse()...');
  
  const mockResponse = {
    results: [
      {
        id: 'test-1',
        title: 'Budget Planning',
        content: 'How to plan a budget',
        similarity: 0.92,
        status: 'active' as const,
        metadata: {
          description: 'Budget planning guide',
          tags: ['finance'],
          author: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ],
    query: 'budget planning',
    count: 1,
    filters: {},
    duration_ms: 150,
  };

  const formattedText = formatLibrarianResponse(mockResponse);
  assert(
    formattedText.includes('Budget Planning'),
    'Should include result title'
  );
  assert(
    formattedText.includes('92% match'),
    'Should include similarity score'
  );
  assert(
    formattedText.includes('budget planning'),
    'Should include query'
  );

  // Test 5: Format Empty Response
  console.log('\n5. Testing formatLibrarianResponse() with empty results...');
  
  const emptyResponse = {
    results: [],
    query: 'nonexistent query',
    count: 0,
    filters: {},
    duration_ms: 50,
  };

  const emptyText = formatLibrarianResponse(emptyResponse);
  assert(
    emptyText.includes('couldn\'t find'),
    'Should include "not found" message'
  );
  assert(
    emptyText.includes('nonexistent query'),
    'Should include the query'
  );

  // Test 6: Invoke Librarian Agent
  console.log('\n6. Testing invokeLibrarianAgent()...');
  
  if (!hasOpenAIKey) {
    console.log('⊘ Skipping invocation test (no OpenAI key)');
  } else {
    try {
      const invocationContext = {
        conversation_history: messages,
        session_id: 'test-session-invocation',
        user_intent: 'find budget planning prompts',
        harness_trace_id: 'trace-123',
      };

      const result = await invokeLibrarianAgent(invocationContext);
      
      assert(
        typeof result === 'object',
        'Should return response object'
      );
      assert(
        Array.isArray(result.results),
        'Should return results'
      );
      assert(
        result.query.includes('budget planning'),
        'Should extract query from user intent'
      );
      
      console.log(`   Invocation completed: ${result.count} results`);
    } catch (error) {
      assert(
        false,
        'Should invoke agent successfully',
        String(error)
      );
    }
  }

  // Test 7: Empty Query Handling
  console.log('\n7. Testing empty query handling...');
  
  try {
    const emptyQuery: LibrarianQuery = {
      query: '   ',
      conversationContext: [],
      sessionId: 'test-session-empty',
    };

    await handleLibrarianQuery(emptyQuery);
    assert(false, 'Should throw error for empty query');
  } catch (error) {
    assert(
      error instanceof Error && error.message.includes('empty'),
      'Should throw LibrarianError for empty query'
    );
  }

  // Test 8: Query with Filters
  console.log('\n8. Testing query with filters...');
  
  if (!hasOpenAIKey) {
    console.log('⊘ Skipping filter test (no OpenAI key)');
  } else {
    try {
      const filteredQuery: LibrarianQuery = {
        query: 'financial prompts',
        conversationContext: [],
        sessionId: 'test-session-filters',
        filters: {
          status: 'active',
          tags: ['finance'],
          threshold: 0.8,
          limit: 5,
        },
      };

      const response = await handleLibrarianQuery(filteredQuery);
      
      assert(
        response.filters.status === 'active',
        'Should apply status filter'
      );
      assert(
        Array.isArray(response.filters.tags) && response.filters.tags.includes('finance'),
        'Should apply tags filter'
      );
      assert(
        response.filters.threshold === 0.8,
        'Should apply threshold filter'
      );
      assert(
        response.filters.limit === 5,
        'Should apply limit filter'
      );
      
      console.log(`   Filtered search: ${response.count} results`);
    } catch (error) {
      assert(
        false,
        'Should handle filters successfully',
        String(error)
      );
    }
  }

  // Cleanup
  await cleanupTestData();

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Tests completed: ${passedTests}/${testCount} passed`);
  
  if (passedTests === testCount) {
    console.log('✓ All tests passed!');
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
