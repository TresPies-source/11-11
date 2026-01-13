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

export async function runCostTrackingTests(): Promise<string[]> {
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

  // Test 1: calculateRoutingCost()
  results.push('\nTesting calculateRoutingCost()');
  const usage: TokenUsage = {
    prompt_tokens: 400,
    completion_tokens: 50,
    total_tokens: 450,
  };

  const costBreakdown = calculateRoutingCost(usage);
  assertClose(costBreakdown.total_cost_usd, 0.00009, 'Should calculate correct cost (400 input + 50 output)');
  assert(costBreakdown.input_tokens === 400, 'Should track input tokens');
  assert(costBreakdown.output_tokens === 50, 'Should track output tokens');

  // Test 2: calculateCostFromTotal()
  results.push('\nTesting calculateCostFromTotal()');
  const estimatedCost = calculateCostFromTotal(450);
  assert(estimatedCost > 0, 'Should return positive cost');
  assert(estimatedCost < 0.001, 'Should be reasonable cost');

  // Test 3: Database persistence
  results.push('\nTesting database operations');
  const testSessionId = `test-session-${Date.now()}`;
  const testDecisionId = crypto.randomUUID();

  try {
    // First insert a routing decision (required for foreign key)
    const db = await getDB();
    await db.query(
      `INSERT INTO routing_decisions (id, session_id, user_query, agent_selected, confidence, reasoning, is_fallback)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [testDecisionId, testSessionId, 'test query', 'dojo', 0.9, 'Test reasoning', false]
    );

    await trackRoutingCost(testDecisionId, testSessionId, usage);
    assert(true, 'Should store routing cost in database');

    const retrievedCost = await getRoutingCost(testDecisionId);
    assert(retrievedCost !== null, 'Should retrieve stored cost');
    assertClose(retrievedCost?.cost_usd || 0, 0.00009, 'Retrieved cost should match');

    const sessionCosts = await getSessionRoutingCosts(testSessionId);
    assert(sessionCosts.total_cost_usd > 0, 'Should aggregate session costs');
    assert(sessionCosts.routing_count === 1, 'Should count queries');

    const history = await getSessionRoutingHistory(testSessionId);
    assert(history.length === 1, 'Should retrieve routing history');
    assert(history[0].routing_decision_id === testDecisionId, 'Should match decision ID');

    // Cleanup
    await db.query('DELETE FROM routing_costs WHERE session_id = $1', [testSessionId]);
    await db.query('DELETE FROM routing_decisions WHERE session_id = $1', [testSessionId]);

  } catch (error) {
    assert(false, 'Database operations failed', String(error));
  }

  results.push(`\n==================================================`);
  results.push(`Tests completed: ${passedTests}/${testCount} passed`);
  results.push(`==================================================`);

  return results;
}
