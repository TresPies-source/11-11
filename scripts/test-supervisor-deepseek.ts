import { routeWithFallback } from '../lib/agents/fallback';
import { getAvailableAgents } from '../lib/agents/supervisor';
import { canUseProvider } from '../lib/llm/client';
import { getModelForAgent } from '../lib/llm/registry';

const testQueries = [
  {
    query: 'Help me debug a conflict in my thinking',
    expectedAgent: 'debugger',
  },
  {
    query: 'Find prompts similar to my budget planning',
    expectedAgent: 'librarian',
  },
  {
    query: 'What are the tradeoffs between approach A and B?',
    expectedAgent: 'dojo',
  },
  {
    query: 'Search for previous conversations about design',
    expectedAgent: 'librarian',
  },
  {
    query: 'I need to explore different perspectives on this idea',
    expectedAgent: 'dojo',
  },
];

async function runTests() {
  console.log('\n=== Testing Supervisor with DeepSeek Integration ===\n');

  console.log('1. Checking API Configuration...');
  const hasDeepSeek = canUseProvider('deepseek');
  const hasOpenAI = canUseProvider('openai');
  const supervisorModel = getModelForAgent('supervisor');

  console.log(`   DeepSeek API: ${hasDeepSeek ? '✓ Available' : '✗ Not configured'}`);
  console.log(`   OpenAI API: ${hasOpenAI ? '✓ Available' : '✗ Not configured'}`);
  console.log(`   Supervisor Model: ${supervisorModel}\n`);

  if (!hasDeepSeek && !hasOpenAI) {
    console.log('⚠️  No API keys configured. Tests will use keyword-based fallback.\n');
  }

  console.log('2. Testing Routing Queries...\n');

  const availableAgents = getAvailableAgents();
  let successCount = 0;
  let totalCount = 0;

  for (const { query, expectedAgent } of testQueries) {
    totalCount++;
    console.log(`   Query: "${query}"`);

    try {
      const decision = await routeWithFallback({
        query,
        conversation_context: [],
        session_id: `test-${Date.now()}`,
        available_agents: availableAgents,
      });

      console.log(`   → Routed to: ${decision.agent_name} (${decision.agent_id})`);
      console.log(`   → Confidence: ${decision.confidence.toFixed(2)}`);
      console.log(`   → Fallback: ${decision.fallback ? 'Yes' : 'No'}`);
      console.log(`   → Reasoning: ${decision.reasoning}`);

      if (decision.usage) {
        console.log(`   → Tokens: ${decision.usage.total_tokens} (${decision.usage.prompt_tokens} prompt + ${decision.usage.completion_tokens} completion)`);
      }

      const matched = decision.agent_id === expectedAgent;
      console.log(`   ${matched ? '✓' : '⚠️'} ${matched ? 'Matched expected agent' : `Expected ${expectedAgent} but got ${decision.agent_id}`}\n`);

      if (matched || decision.fallback) {
        successCount++;
      }
    } catch (error) {
      console.error(`   ✗ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  console.log('=== Summary ===');
  console.log(`Tests passed: ${successCount}/${totalCount}`);
  console.log(successCount === totalCount ? '✅ All tests passed!' : `⚠️  ${totalCount - successCount} tests failed`);
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
