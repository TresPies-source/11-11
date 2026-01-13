/**
 * API endpoints test for Librarian search and embed routes.
 * 
 * Tests both /api/librarian/search and /api/librarian/embed endpoints
 * in dev mode (with mock auth).
 * 
 * Run with: tsx lib/librarian/api.test.ts
 */

interface SearchRequest {
  query: string;
  filters?: {
    status?: 'draft' | 'active' | 'archived' | Array<'draft' | 'active' | 'archived'>;
    tags?: string[];
    threshold?: number;
    limit?: number;
  };
}

interface EmbedRequest {
  prompt_id: string;
  content: string;
  session_id?: string;
}

async function testSearchAPI() {
  console.log('\n=== Testing Search API ===\n');

  const testCases: Array<{ name: string; request: SearchRequest; shouldSucceed: boolean }> = [
    {
      name: 'Valid search query',
      request: {
        query: 'budget planning',
        filters: {
          limit: 5,
          threshold: 0.7,
        },
      },
      shouldSucceed: true,
    },
    {
      name: 'Search with status filter',
      request: {
        query: 'testing prompts',
        filters: {
          status: 'active',
          limit: 10,
        },
      },
      shouldSucceed: true,
    },
    {
      name: 'Search with tags filter',
      request: {
        query: 'development',
        filters: {
          tags: ['engineering', 'feature'],
          threshold: 0.75,
        },
      },
      shouldSucceed: true,
    },
    {
      name: 'Empty query (should fail)',
      request: {
        query: '',
      },
      shouldSucceed: false,
    },
    {
      name: 'Invalid threshold (should fail)',
      request: {
        query: 'test',
        filters: {
          threshold: 1.5,
        },
      },
      shouldSucceed: false,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);

      const response = await fetch('http://localhost:3000/api/librarian/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.request),
      });

      const data = await response.json();

      if (testCase.shouldSucceed) {
        if (response.ok) {
          console.log(`✅ PASS: ${testCase.name}`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Results: ${data.count || 0} found`);
          console.log(`   Duration: ${data.duration_ms}ms`);
          passed++;
        } else {
          console.log(`❌ FAIL: ${testCase.name}`);
          console.log(`   Expected success but got ${response.status}`);
          console.log(`   Error: ${data.error}`);
          failed++;
        }
      } else {
        if (!response.ok) {
          console.log(`✅ PASS: ${testCase.name}`);
          console.log(`   Status: ${response.status} (expected failure)`);
          console.log(`   Error: ${data.error}`);
          passed++;
        } else {
          console.log(`❌ FAIL: ${testCase.name}`);
          console.log(`   Expected failure but got success`);
          failed++;
        }
      }
    } catch (error) {
      console.log(`❌ FAIL: ${testCase.name}`);
      console.log(`   Exception: ${error}`);
      failed++;
    }

    console.log('');
  }

  console.log(`Search API Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

async function testEmbedAPI() {
  console.log('\n=== Testing Embed API ===\n');

  const testCases: Array<{ name: string; request: EmbedRequest; shouldSucceed: boolean }> = [
    {
      name: 'Valid embed request',
      request: {
        prompt_id: 'test-prompt-001',
        content: 'This is a test prompt for embedding generation.',
        session_id: 'test-session-001',
      },
      shouldSucceed: true,
    },
    {
      name: 'Valid embed without session',
      request: {
        prompt_id: 'test-prompt-002',
        content: 'Another test prompt without session ID.',
      },
      shouldSucceed: true,
    },
    {
      name: 'Empty content (should fail)',
      request: {
        prompt_id: 'test-prompt-003',
        content: '',
      },
      shouldSucceed: false,
    },
    {
      name: 'Missing prompt_id (should fail)',
      request: {
        prompt_id: '',
        content: 'Content without ID',
      },
      shouldSucceed: false,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);

      const response = await fetch('http://localhost:3000/api/librarian/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.request),
      });

      const data = await response.json();

      if (testCase.shouldSucceed) {
        if (response.ok) {
          console.log(`✅ PASS: ${testCase.name}`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Tokens: ${data.tokens_used || 0}`);
          console.log(`   Cost: $${data.cost_usd?.toFixed(6) || '0.000000'}`);
          console.log(`   Model: ${data.model || 'unknown'}`);
          passed++;
        } else {
          console.log(`❌ FAIL: ${testCase.name}`);
          console.log(`   Expected success but got ${response.status}`);
          console.log(`   Error: ${data.error}`);
          failed++;
        }
      } else {
        if (!response.ok) {
          console.log(`✅ PASS: ${testCase.name}`);
          console.log(`   Status: ${response.status} (expected failure)`);
          console.log(`   Error: ${data.error}`);
          passed++;
        } else {
          console.log(`❌ FAIL: ${testCase.name}`);
          console.log(`   Expected failure but got success`);
          failed++;
        }
      }
    } catch (error) {
      console.log(`❌ FAIL: ${testCase.name}`);
      console.log(`   Exception: ${error}`);
      failed++;
    }

    console.log('');
  }

  console.log(`Embed API Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        Librarian API Endpoints Test Suite                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log('\nℹ️  Make sure dev server is running: npm run dev');
  console.log('ℹ️  Make sure NEXT_PUBLIC_DEV_MODE=true in .env.local');
  console.log('ℹ️  Make sure OPENAI_API_KEY is set (for embed endpoint)');
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  const searchResults = await testSearchAPI();
  const embedResults = await testEmbedAPI();

  const totalPassed = searchResults.passed + embedResults.passed;
  const totalFailed = searchResults.failed + embedResults.failed;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      Final Results                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Total Passed: ${totalPassed}`);
  console.log(`❌ Total Failed: ${totalFailed}`);
  console.log(`📊 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%\n`);

  process.exit(totalFailed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
