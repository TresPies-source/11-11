import {
  getAgentUsageStats,
  getAllAgentsUsageStats,
} from '../../lib/agents/usage-stats';
import { getDB } from '../../lib/pglite/client';

console.log('Testing Usage Stats...\n');

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

  const sessionId = 'usage-stats-test-session';

  const dojoDecision = await db.query<{ id: string }>(
    `INSERT INTO routing_decisions (
      session_id, user_query, agent_selected, confidence, reasoning, is_fallback
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [sessionId, 'Dojo query 1', 'dojo', 0.95, 'Thinking partnership', false]
  );

  const librarianDecision1 = await db.query<{ id: string }>(
    `INSERT INTO routing_decisions (
      session_id, user_query, agent_selected, confidence, reasoning, is_fallback
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [sessionId, 'Search query 1', 'librarian', 0.88, 'Search intent', false]
  );

  const librarianDecision2 = await db.query<{ id: string }>(
    `INSERT INTO routing_decisions (
      session_id, user_query, agent_selected, confidence, reasoning, is_fallback
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [sessionId, 'Search query 2', 'librarian', 0.92, 'Search intent', false]
  );

  await db.query(
    `INSERT INTO routing_costs (
      routing_decision_id, session_id, tokens_used, cost_usd, model
    ) VALUES ($1, $2, $3, $4, $5)`,
    [dojoDecision.rows[0].id, sessionId, 500, 0.0001, 'gpt-4o-mini']
  );

  await db.query(
    `INSERT INTO routing_costs (
      routing_decision_id, session_id, tokens_used, cost_usd, model
    ) VALUES ($1, $2, $3, $4, $5)`,
    [librarianDecision1.rows[0].id, sessionId, 400, 0.00008, 'gpt-4o-mini']
  );

  await db.query(
    `INSERT INTO routing_costs (
      routing_decision_id, session_id, tokens_used, cost_usd, model
    ) VALUES ($1, $2, $3, $4, $5)`,
    [librarianDecision2.rows[0].id, sessionId, 600, 0.00012, 'gpt-4o-mini']
  );

  console.log('Test data setup complete\n');
}

async function testGetAgentUsageStats(): Promise<void> {
  console.log('\nTesting getAgentUsageStats()');

  const dojoStats = await getAgentUsageStats('dojo');
  assert(
    dojoStats !== null,
    'Dojo stats are returned'
  );
  assert(
    dojoStats?.query_count === 1,
    `Dojo query count is 1 (got ${dojoStats?.query_count})`
  );
  assert(
    dojoStats?.avg_tokens_used === 500,
    `Dojo avg tokens is 500 (got ${dojoStats?.avg_tokens_used})`
  );
  assert(
    dojoStats?.total_cost_usd === 0.0001,
    `Dojo total cost is correct (got ${dojoStats?.total_cost_usd})`
  );
  assert(
    dojoStats?.last_used_at !== null,
    'Dojo last_used_at is not null'
  );

  const librarianStats = await getAgentUsageStats('librarian');
  assert(
    librarianStats !== null,
    'Librarian stats are returned'
  );
  assert(
    librarianStats?.query_count === 2,
    `Librarian query count is 2 (got ${librarianStats?.query_count})`
  );
  assert(
    librarianStats?.avg_tokens_used === 500,
    `Librarian avg tokens is 500 (got ${librarianStats?.avg_tokens_used})`
  );
  assert(
    librarianStats?.total_cost_usd === 0.0002,
    `Librarian total cost is correct (got ${librarianStats?.total_cost_usd})`
  );

  const nonExistentStats = await getAgentUsageStats('non-existent-agent');
  assert(
    nonExistentStats === null,
    'Non-existent agent returns null'
  );

  const debuggerStats = await getAgentUsageStats('debugger');
  assert(
    debuggerStats === null,
    'Debugger with no usage returns null'
  );
}

async function testGetAllAgentsUsageStats(): Promise<void> {
  console.log('\nTesting getAllAgentsUsageStats()');

  const allStats = await getAllAgentsUsageStats();
  
  assert(
    typeof allStats === 'object',
    'Returns an object'
  );

  assert(
    'dojo' in allStats,
    'Dojo is in the stats map'
  );

  assert(
    'librarian' in allStats,
    'Librarian is in the stats map'
  );

  assert(
    allStats.dojo.query_count === 1,
    `Dojo query count is 1 in aggregated stats (got ${allStats.dojo?.query_count})`
  );

  assert(
    allStats.librarian.query_count === 2,
    `Librarian query count is 2 in aggregated stats (got ${allStats.librarian?.query_count})`
  );

  assert(
    !('debugger' in allStats),
    'Debugger is not in stats map (no usage)'
  );

  assert(
    Object.keys(allStats).length >= 2,
    `At least 2 agents have stats (got ${Object.keys(allStats).length})`
  );
}

async function testMissingDataHandling(): Promise<void> {
  console.log('\nTesting missing data handling');

  const statsWithNoData = await getAgentUsageStats('supervisor');
  
  if (statsWithNoData === null) {
    assert(
      true,
      'Supervisor with no usage returns null'
    );
  } else {
    console.log(`  Note: Supervisor has usage data: ${JSON.stringify(statsWithNoData)}`);
    assert(
      statsWithNoData.query_count >= 0,
      'Supervisor stats are valid if present'
    );
  }

  const allStatsMap = await getAllAgentsUsageStats();
  assert(
    typeof allStatsMap === 'object',
    'getAllAgentsUsageStats handles missing data gracefully'
  );
}

async function runAllTests(): Promise<void> {
  try {
    await setupTestData();
    await testGetAgentUsageStats();
    await testGetAllAgentsUsageStats();
    await testMissingDataHandling();

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Tests passed: ${passedTests}/${testCount}`);
    console.log(`${'='.repeat(50)}\n`);

    if (passedTests === testCount) {
      console.log('✓ All usage stats tests passed!');
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
