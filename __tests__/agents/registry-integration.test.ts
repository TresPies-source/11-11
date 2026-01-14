import { loadAgentRegistry, getAgentById } from '../../lib/agents/supervisor';
import { getAgentStatus } from '../../lib/agents/status';
import { getAgentUsageStats, getAllAgentsUsageStats } from '../../lib/agents/usage-stats';
import { getDB } from '../../lib/pglite/client';

console.log('Testing Agent Registry Integration...\n');

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

  const sessionId = 'registry-integration-test';

  const dojoDecision = await db.query<{ id: string }>(
    `INSERT INTO routing_decisions (
      session_id, user_query, agent_selected, confidence, reasoning, is_fallback
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [sessionId, 'Integration test query', 'dojo', 0.89, 'Test reasoning', false]
  );

  await db.query(
    `INSERT INTO routing_costs (
      routing_decision_id, session_id, tokens_used, cost_usd, model
    ) VALUES ($1, $2, $3, $4, $5)`,
    [dojoDecision.rows[0].id, sessionId, 300, 0.00006, 'gpt-4o-mini']
  );

  console.log('Test data setup complete\n');
}

async function testFullRegistryFlow(): Promise<void> {
  console.log('\nTesting full registry flow (simulating /api/agents/registry)');

  const registry = loadAgentRegistry();
  const agentsWithStatus = registry.agents.map(agent => ({
    ...agent,
    status: getAgentStatus(agent.id),
  }));

  assert(
    agentsWithStatus.length >= 3,
    `Registry has at least 3 agents (got ${agentsWithStatus.length})`
  );

  for (const agent of agentsWithStatus) {
    assert(
      typeof agent.icon === 'string',
      `Agent ${agent.id} has icon field`
    );

    assert(
      typeof agent.tagline === 'string',
      `Agent ${agent.id} has tagline field`
    );

    assert(
      agent.status === 'online' || agent.status === 'offline',
      `Agent ${agent.id} has valid status: ${agent.status}`
    );
  }

  console.log(`\n  Successfully loaded ${agentsWithStatus.length} agents for registry page`);
}

async function testFullAgentDetailsFlow(): Promise<void> {
  console.log('\nTesting full agent details flow (simulating /api/agents/[agentId])');

  const agentId = 'dojo';
  const agent = getAgentById(agentId);
  const status = getAgentStatus(agentId);
  const usage_stats = await getAgentUsageStats(agentId);

  assert(
    agent !== null,
    `Agent ${agentId} found in registry`
  );

  assert(
    status === 'online' || status === 'offline',
    `Agent ${agentId} has valid status`
  );

  if (usage_stats) {
    assert(
      typeof usage_stats.query_count === 'number',
      `Agent ${agentId} usage stats have query_count`
    );

    assert(
      typeof usage_stats.total_cost_usd === 'number',
      `Agent ${agentId} usage stats have total_cost_usd`
    );
  }

  const response = {
    id: agent.id,
    name: agent.name,
    icon: agent.icon,
    tagline: agent.tagline,
    description: agent.description,
    when_to_use: agent.when_to_use,
    when_not_to_use: agent.when_not_to_use,
    status,
    usage_stats,
  };

  assert(
    typeof response === 'object',
    'Full agent details response is an object'
  );

  console.log('\n  Sample agent details response:');
  console.log(JSON.stringify(response, null, 2));
}

async function testAgentCardToModalFlow(): Promise<void> {
  console.log('\nTesting agent card → modal flow');

  const registry = loadAgentRegistry();
  const selectedAgentId = registry.agents[0].id;

  console.log(`  Step 1: User clicks on agent card for "${selectedAgentId}"`);
  
  const agent = getAgentById(selectedAgentId);
  assert(
    agent !== null,
    `Agent ${selectedAgentId} found when clicked`
  );

  console.log(`  Step 2: Fetching agent details for modal`);
  
  const status = getAgentStatus(selectedAgentId);
  const usage_stats = await getAgentUsageStats(selectedAgentId);

  const modalData = {
    ...agent,
    status,
    usage_stats,
  };

  assert(
    'icon' in modalData,
    'Modal data includes icon'
  );

  assert(
    'tagline' in modalData,
    'Modal data includes tagline'
  );

  assert(
    'when_to_use' in modalData,
    'Modal data includes when_to_use'
  );

  assert(
    'when_not_to_use' in modalData,
    'Modal data includes when_not_to_use'
  );

  assert(
    'status' in modalData,
    'Modal data includes status'
  );

  console.log(`  Step 3: Modal displays agent details successfully`);
  console.log(`    → Agent: ${modalData.name}`);
  console.log(`    → Status: ${modalData.status}`);
  console.log(`    → When to use: ${modalData.when_to_use.length} items`);
  console.log(`    → When not to use: ${modalData.when_not_to_use.length} items`);
  if (usage_stats) {
    console.log(`    → Usage: ${usage_stats.query_count} queries, $${usage_stats.total_cost_usd.toFixed(5)}`);
  }
}

async function testUsageStatsAggregation(): Promise<void> {
  console.log('\nTesting usage stats aggregation across all agents');

  const allStats = await getAllAgentsUsageStats();

  assert(
    typeof allStats === 'object',
    'All stats is an object'
  );

  const agentsWithUsage = Object.keys(allStats);
  
  assert(
    agentsWithUsage.length >= 1,
    `At least 1 agent has usage stats (got ${agentsWithUsage.length})`
  );

  for (const agentId of agentsWithUsage) {
    const stats = allStats[agentId];
    
    assert(
      typeof stats.query_count === 'number' && stats.query_count >= 0,
      `Agent ${agentId} has valid query_count: ${stats.query_count}`
    );

    assert(
      typeof stats.total_cost_usd === 'number' && stats.total_cost_usd >= 0,
      `Agent ${agentId} has valid total_cost_usd: $${stats.total_cost_usd.toFixed(5)}`
    );
  }

  console.log(`\n  Aggregated usage stats for ${agentsWithUsage.length} agents:`);
  for (const agentId of agentsWithUsage) {
    const stats = allStats[agentId];
    console.log(`    → ${agentId}: ${stats.query_count} queries, $${stats.total_cost_usd.toFixed(5)}`);
  }
}

async function runAllTests(): Promise<void> {
  try {
    await setupTestData();
    await testFullRegistryFlow();
    await testFullAgentDetailsFlow();
    await testAgentCardToModalFlow();
    await testUsageStatsAggregation();

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Tests passed: ${passedTests}/${testCount}`);
    console.log(`${'='.repeat(50)}\n`);

    if (passedTests === testCount) {
      console.log('✓ All integration tests passed!');
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
