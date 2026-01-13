import {
  calculateRoutingCost,
  calculateCostFromTotal,
  trackRoutingCost,
  trackRoutingCostSimple,
  getSessionRoutingCosts,
  getRoutingCost,
  getSessionRoutingHistory,
} from '../../lib/agents/cost-tracking';
import { GPT_4O_MINI_PRICING } from '../../lib/openai/types';
import type { TokenUsage } from '../../lib/agents/types';
import { getDB } from '../../lib/pglite/client';

console.log('Testing Cost Tracking...\n');

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

function assertClose(
  actual: number,
  expected: number,
  testName: string,
  tolerance: number = 0.0000001
): void {
  const condition = Math.abs(actual - expected) < tolerance;
  assert(
    condition,
    testName,
    `Expected ${expected}, got ${actual} (diff: ${Math.abs(actual - expected)})`
  );
}

async function testCalculateRoutingCost(): Promise<void> {
  console.log('\nTesting calculateRoutingCost()');

  const usage: TokenUsage = {
    prompt_tokens: 400,
    completion_tokens: 50,
    total_tokens: 450,
  };

  const costBreakdown = calculateRoutingCost(usage);

  assert(
    costBreakdown.input_tokens === 400,
    'Input tokens match'
  );
  assert(
    costBreakdown.output_tokens === 50,
    'Output tokens match'
  );
  assert(
    costBreakdown.total_tokens === 450,
    'Total tokens match'
  );
  assertClose(
    costBreakdown.input_cost_usd,
    400 * GPT_4O_MINI_PRICING.input,
    'Input cost calculated correctly'
  );
  assertClose(
    costBreakdown.output_cost_usd,
    50 * GPT_4O_MINI_PRICING.output,
    'Output cost calculated correctly'
  );
  assertClose(
    costBreakdown.total_cost_usd,
    (400 * GPT_4O_MINI_PRICING.input) + (50 * GPT_4O_MINI_PRICING.output),
    'Total cost calculated correctly'
  );

  const zeroUsage: TokenUsage = {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };
  const zeroCost = calculateRoutingCost(zeroUsage);
  assert(
    zeroCost.total_cost_usd === 0,
    'Zero tokens result in zero cost'
  );

  const largeUsage: TokenUsage = {
    prompt_tokens: 10000,
    completion_tokens: 2000,
    total_tokens: 12000,
  };
  const largeCost = calculateRoutingCost(largeUsage);
  assert(
    largeCost.total_cost_usd > 0,
    'Large token counts result in positive cost'
  );
}

async function testCalculateCostFromTotal(): Promise<void> {
  console.log('\nTesting calculateCostFromTotal()');

  const totalTokens = 450;
  const cost = calculateCostFromTotal(totalTokens);

  const estimatedInputTokens = totalTokens * 0.7;
  const estimatedOutputTokens = totalTokens * 0.3;
  const expectedCost =
    (estimatedInputTokens * GPT_4O_MINI_PRICING.input) +
    (estimatedOutputTokens * GPT_4O_MINI_PRICING.output);

  assertClose(
    cost,
    expectedCost,
    'Estimated cost using weighted average'
  );

  const zeroCost = calculateCostFromTotal(0);
  assert(
    zeroCost === 0,
    'Zero tokens result in zero cost'
  );

  const largeCost = calculateCostFromTotal(10000);
  assert(
    largeCost > 0 && largeCost < 1,
    'Large token count (10k) costs less than $1'
  );
}

async function testTrackRoutingCost(): Promise<void> {
  console.log('\nTesting trackRoutingCost()');

  const db = await getDB();

  const routingDecisionResult = await db.query<{ id: string }>(
    `INSERT INTO routing_decisions (
      session_id, user_query, agent_selected, confidence, reasoning, is_fallback
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['test-session-cost-1', 'test query', 'dojo', 0.95, 'Test routing', false]
  );

  const routingDecisionId = routingDecisionResult.rows[0].id;

  const usage: TokenUsage = {
    prompt_tokens: 400,
    completion_tokens: 50,
    total_tokens: 450,
  };

  const costId = await trackRoutingCost(
    routingDecisionId,
    'test-session-cost-1',
    usage,
    'gpt-4o-mini'
  );

  assert(
    typeof costId === 'string' && costId.length > 0,
    'Cost ID is returned'
  );

  const costRecord = await getRoutingCost(routingDecisionId);
  assert(
    costRecord !== null,
    'Cost record is stored in database'
  );
  assert(
    costRecord?.routing_decision_id === routingDecisionId,
    'Cost record links to routing decision'
  );
  assert(
    costRecord?.session_id === 'test-session-cost-1',
    'Session ID matches'
  );
  assert(
    costRecord?.tokens_used === 450,
    'Tokens used matches'
  );
  assert(
    costRecord?.model === 'gpt-4o-mini',
    'Model matches'
  );
  assert(
    (costRecord?.cost_usd ?? 0) > 0,
    'Cost is positive'
  );

  const linkCheck = await db.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM routing_costs WHERE routing_decision_id = $1`,
    [routingDecisionId]
  );

  assert(
    linkCheck.rows[0].count === 1,
    'Foreign key relationship works'
  );
}

async function testTrackRoutingCostSimple(): Promise<void> {
  console.log('\nTesting trackRoutingCostSimple()');

  const db = await getDB();

  const routingDecisionResult = await db.query<{ id: string }>(
    `INSERT INTO routing_decisions (
      session_id, user_query, agent_selected, confidence, reasoning, is_fallback
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['test-session-cost-2', 'simple query', 'dojo', 0.75, 'Default routing', true]
  );

  const routingDecisionId = routingDecisionResult.rows[0].id;

  const costId = await trackRoutingCostSimple(
    routingDecisionId,
    'test-session-cost-2',
    450,
    'gpt-4o-mini'
  );

  assert(
    typeof costId === 'string' && costId.length > 0,
    'Cost ID is returned'
  );

  const costRecord = await getRoutingCost(routingDecisionId);
  assert(
    costRecord !== null,
    'Cost record is stored'
  );
  assert(
    costRecord?.tokens_used === 450,
    'Tokens used matches'
  );
  assert(
    (costRecord?.cost_usd ?? 0) > 0,
    'Cost is calculated and stored'
  );
}

async function testGetSessionRoutingCosts(): Promise<void> {
  console.log('\nTesting getSessionRoutingCosts()');

  const db = await getDB();
  const sessionId = 'test-session-aggregate';

  const decision1 = await db.query<{ id: string }>(
    `INSERT INTO routing_decisions (
      session_id, user_query, agent_selected, confidence, reasoning, is_fallback
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [sessionId, 'query 1', 'dojo', 0.9, 'Test 1', false]
  );

  const decision2 = await db.query<{ id: string }>(
    `INSERT INTO routing_decisions (
      session_id, user_query, agent_selected, confidence, reasoning, is_fallback
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [sessionId, 'query 2', 'librarian', 0.85, 'Test 2', false]
  );

  await trackRoutingCostSimple(decision1.rows[0].id, sessionId, 400);
  await trackRoutingCostSimple(decision2.rows[0].id, sessionId, 600);

  const aggregated = await getSessionRoutingCosts(sessionId);

  assert(
    aggregated.routing_count === 2,
    'Routing count is aggregated correctly'
  );
  assert(
    aggregated.total_tokens === 1000,
    'Total tokens are aggregated correctly'
  );
  assert(
    aggregated.total_cost_usd > 0,
    'Total cost is aggregated correctly'
  );

  const emptySession = await getSessionRoutingCosts('non-existent-session');
  assert(
    emptySession.routing_count === 0 &&
    emptySession.total_tokens === 0 &&
    emptySession.total_cost_usd === 0,
    'Returns zero values for non-existent session'
  );
}

async function testGetSessionRoutingHistory(): Promise<void> {
  console.log('\nTesting getSessionRoutingHistory()');

  const db = await getDB();
  const sessionId = 'test-session-history';

  const decision1 = await db.query<{ id: string }>(
    `INSERT INTO routing_decisions (
      session_id, user_query, agent_selected, confidence, reasoning, is_fallback
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [sessionId, 'history query 1', 'dojo', 0.95, 'High confidence', false]
  );

  const decision2 = await db.query<{ id: string }>(
    `INSERT INTO routing_decisions (
      session_id, user_query, agent_selected, confidence, reasoning, is_fallback
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [sessionId, 'history query 2', 'librarian', 0.82, 'Search intent', false]
  );

  await trackRoutingCostSimple(decision1.rows[0].id, sessionId, 400);
  await trackRoutingCostSimple(decision2.rows[0].id, sessionId, 600);

  const history = await getSessionRoutingHistory(sessionId);

  assert(
    history.length === 2,
    'Returns correct number of history records'
  );
  assert(
    history[0].agent_selected !== undefined,
    'History includes agent_selected'
  );
  assert(
    history[0].confidence !== undefined,
    'History includes confidence'
  );
  assert(
    history[0].tokens_used !== undefined,
    'History includes tokens_used'
  );
  assert(
    history[0].cost_usd > 0,
    'History includes cost'
  );
  assert(
    history[0].created_at !== undefined,
    'History includes timestamp'
  );

  const emptyHistory = await getSessionRoutingHistory('non-existent-history-session');
  assert(
    emptyHistory.length === 0,
    'Returns empty array for non-existent session'
  );
}

async function testCostAccuracy(): Promise<void> {
  console.log('\nTesting cost accuracy');

  const usage: TokenUsage = {
    prompt_tokens: 1000,
    completion_tokens: 200,
    total_tokens: 1200,
  };

  const costBreakdown = calculateRoutingCost(usage);

  const expectedInputCost = 1000 * (0.00015 / 1000);
  const expectedOutputCost = 200 * (0.0006 / 1000);
  const expectedTotalCost = expectedInputCost + expectedOutputCost;

  assertClose(
    costBreakdown.input_cost_usd,
    expectedInputCost,
    'Input cost matches GPT-4o-mini pricing exactly',
    0.0000000001
  );
  assertClose(
    costBreakdown.output_cost_usd,
    expectedOutputCost,
    'Output cost matches GPT-4o-mini pricing exactly',
    0.0000000001
  );
  assertClose(
    costBreakdown.total_cost_usd,
    expectedTotalCost,
    'Total cost matches GPT-4o-mini pricing exactly',
    0.0000000001
  );

  const typicalUsage: TokenUsage = {
    prompt_tokens: 450,
    completion_tokens: 50,
    total_tokens: 500,
  };

  const typicalCost = calculateRoutingCost(typicalUsage);

  assert(
    typicalCost.total_cost_usd < 0.001 && typicalCost.total_cost_usd > 0,
    'Typical routing query costs less than $0.001'
  );
}

async function runAllTests(): Promise<void> {
  try {
    await getDB();

    await testCalculateRoutingCost();
    await testCalculateCostFromTotal();
    await testTrackRoutingCost();
    await testTrackRoutingCostSimple();
    await testGetSessionRoutingCosts();
    await testGetSessionRoutingHistory();
    await testCostAccuracy();

    console.log(`\n✓ Passed ${passedTests} of ${testCount} tests`);

    if (passedTests === testCount) {
      process.exit(0);
    } else {
      console.error(`\n✗ ${testCount - passedTests} tests failed`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Test suite failed with error:');
    console.error(error);
    process.exit(1);
  }
}

runAllTests();
