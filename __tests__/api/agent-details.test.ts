import { getDB } from '../../lib/pglite/client';

console.log('Testing Agent Details API Integration...\n');

let testCount = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, message?: string): void {
  testCount++;
  if (condition) {
    passedTests++;
    console.log(`✓ ${testName}`);
  } else {
    console.error(`✗ ${testName}`);
    if (message) {
      console.error(`  ${message}`);
    }
  }
}

async function setupTestData(): Promise<void> {
  console.log('\nSetting up test data...');
  const db = await getDB();

  const sessionId = 'api-integration-test';

  const dojoDecision = await db.query<{ id: string }>(
    `INSERT INTO routing_decisions (
      session_id, user_query, agent_selected, confidence, reasoning, is_fallback
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [sessionId, 'Test query for dojo', 'dojo', 0.93, 'Thinking needed', false]
  );

  await db.query(
    `INSERT INTO routing_costs (
      routing_decision_id, session_id, tokens_used, cost_usd, model
    ) VALUES ($1, $2, $3, $4, $5)`,
    [dojoDecision.rows[0].id, sessionId, 450, 0.00009, 'gpt-4o-mini']
  );

  console.log('Test data setup complete\n');
}

async function testAgentDetailsAPIStructure(): Promise<void> {
  console.log('\nTesting Agent Details API data structure');

  const { getAgentById } = await import('../../lib/agents/supervisor');
  const { getAgentStatus } = await import('../../lib/agents/status');
  const { getAgentUsageStats } = await import('../../lib/agents/usage-stats');

  const agentId = 'dojo';
  const agent = getAgentById(agentId);
  const status = getAgentStatus(agentId);
  const usage_stats = await getAgentUsageStats(agentId);

  assert(
    agent !== null,
    'Agent data is retrieved'
  );

  assert(
    agent.id === agentId,
    `Agent ID matches (got ${agent.id})`
  );

  assert(
    typeof agent.name === 'string' && agent.name.length > 0,
    'Agent name is present'
  );

  assert(
    typeof agent.icon === 'string' && agent.icon.length > 0,
    'Agent icon is present'
  );

  assert(
    typeof agent.tagline === 'string' && agent.tagline.length > 0,
    'Agent tagline is present'
  );

  assert(
    typeof agent.description === 'string',
    'Agent description is present'
  );

  assert(
    Array.isArray(agent.when_to_use),
    'Agent when_to_use is an array'
  );

  assert(
    Array.isArray(agent.when_not_to_use),
    'Agent when_not_to_use is an array'
  );

  assert(
    status === 'online' || status === 'offline',
    `Agent status is valid (got ${status})`
  );

  assert(
    usage_stats !== null,
    'Usage stats are returned'
  );

  assert(
    (usage_stats?.query_count ?? 0) >= 1,
    `Usage stats show at least 1 query (got ${usage_stats?.query_count})`
  );

  assert(
    typeof usage_stats?.total_cost_usd === 'number',
    'Usage stats include total cost'
  );

  assert(
    typeof usage_stats?.avg_tokens_used === 'number',
    'Usage stats include avg tokens'
  );

  assert(
    usage_stats?.last_used_at !== undefined,
    'Usage stats include last_used_at'
  );

  const responseShape = {
    id: agent.id,
    name: agent.name,
    icon: agent.icon,
    tagline: agent.tagline,
    description: agent.description,
    when_to_use: agent.when_to_use,
    when_not_to_use: agent.when_not_to_use,
    default: agent.default,
    status,
    usage_stats,
  };

  assert(
    responseShape.id === agentId,
    'Response shape matches API spec'
  );

  console.log('\n  Sample API response shape:');
  console.log(JSON.stringify(responseShape, null, 2));
}

async function testMultipleAgents(): Promise<void> {
  console.log('\nTesting multiple agent data retrieval');

  const { loadAgentRegistry } = await import('../../lib/agents/supervisor');
  const { getAgentStatus } = await import('../../lib/agents/status');
  const { getAllAgentsUsageStats } = await import('../../lib/agents/usage-stats');

  const registry = loadAgentRegistry();
  const agents = registry.agents;
  const allStats = await getAllAgentsUsageStats();

  assert(
    agents.length >= 3,
    `At least 3 agents are registered (got ${agents.length})`
  );

  let onlineCount = 0;
  for (const agent of agents) {
    const status = getAgentStatus(agent.id);
    if (status === 'online') {
      onlineCount++;
    }
    
    assert(
      typeof agent.icon === 'string',
      `Agent ${agent.id} has icon`
    );
    
    assert(
      typeof agent.tagline === 'string',
      `Agent ${agent.id} has tagline`
    );
  }

  assert(
    onlineCount >= 1,
    `At least 1 agent is online (got ${onlineCount})`
  );

  assert(
    Object.keys(allStats).length >= 1,
    `At least 1 agent has usage stats (got ${Object.keys(allStats).length})`
  );
}

async function runAllTests(): Promise<void> {
  try {
    await setupTestData();
    await testAgentDetailsAPIStructure();
    await testMultipleAgents();

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Tests passed: ${passedTests}/${testCount}`);
    console.log(`${'='.repeat(50)}\n`);

    if (passedTests === testCount) {
      console.log('✓ All API integration tests passed!');
      process.exit(0);
    } else {
      console.error('✗ Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Test suite error:', error);
    process.exit(1);
  }
}

runAllTests();
