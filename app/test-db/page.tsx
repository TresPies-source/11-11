'use client';

/**
 * Database Integration Test Page
 * Visit http://localhost:3000/test-db to run database persistence tests
 */

import { useState } from 'react';
import { getDB } from '@/lib/pglite/client';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

export default function TestDBPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (index: number, update: Partial<TestResult>) => {
    setResults(prev => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], ...update };
      return newResults;
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [
      { name: 'Initialize PGlite database', status: 'pending' },
      { name: 'Insert routing decision', status: 'pending' },
      { name: 'Insert routing cost', status: 'pending' },
      { name: 'Verify foreign key relationship', status: 'pending' },
      { name: 'Insert agent handoff', status: 'pending' },
      { name: 'Query session routing history', status: 'pending' },
      { name: 'Aggregate session costs', status: 'pending' },
      { name: 'Query handoff history', status: 'pending' },
    ];
    setResults(testResults);

    const sessionId = `test-db-${Date.now()}`;

    try {
      // Test 1: Initialize database
      updateResult(0, { status: 'running' });
      const start1 = Date.now();
      const db = await getDB();
      updateResult(0, {
        status: 'passed',
        message: 'Database initialized successfully',
        duration: Date.now() - start1,
      });

      // Test 2: Insert routing decision
      updateResult(1, { status: 'running' });
      const start2 = Date.now();
      const decisionResult = await db.query(
        `INSERT INTO routing_decisions (session_id, user_query, agent_selected, confidence, reasoning, is_fallback, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id`,
        [sessionId, 'Test query for routing', 'dojo', 0.85, 'Test routing decision', false]
      );
      const decisionId = decisionResult.rows[0].id;
      updateResult(1, {
        status: 'passed',
        message: `Inserted routing decision (ID: ${decisionId})`,
        duration: Date.now() - start2,
      });

      // Test 3: Insert routing cost
      updateResult(2, { status: 'running' });
      const start3 = Date.now();
      await db.query(
        `INSERT INTO routing_costs (routing_decision_id, session_id, tokens_used, cost_usd, model, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [decisionId, sessionId, 450, 0.000225, 'gpt-4o-mini']
      );
      updateResult(2, {
        status: 'passed',
        message: 'Inserted routing cost',
        duration: Date.now() - start3,
      });

      // Test 4: Verify foreign key relationship
      updateResult(3, { status: 'running' });
      const start4 = Date.now();
      const costResult = await db.query(
        `SELECT rc.*, rd.agent_selected, rd.reasoning
         FROM routing_costs rc
         JOIN routing_decisions rd ON rc.routing_decision_id = rd.id
         WHERE rc.session_id = $1`,
        [sessionId]
      );
      const hasJoin = costResult.rows.length > 0 && costResult.rows[0].reasoning === 'Test routing decision';
      updateResult(3, {
        status: hasJoin ? 'passed' : 'failed',
        message: hasJoin ? 'Foreign key relationship verified' : 'Foreign key join failed',
        duration: Date.now() - start4,
      });

      // Test 5: Insert agent handoff
      updateResult(4, { status: 'running' });
      const start5 = Date.now();
      await db.query(
        `INSERT INTO agent_handoffs (session_id, from_agent, to_agent, reason, user_intent, conversation_history, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          sessionId,
          'dojo',
          'librarian',
          'User wants to search for prompts',
          'Find similar prompts',
          JSON.stringify([
            { role: 'user', content: 'I want to search' },
            { role: 'assistant', content: 'Let me help you search' },
          ]),
        ]
      );
      updateResult(4, {
        status: 'passed',
        message: 'Inserted agent handoff',
        duration: Date.now() - start5,
      });

      // Test 6: Query session routing history
      updateResult(5, { status: 'running' });
      const start6 = Date.now();
      const historyResult = await db.query(
        `SELECT rd.id, rd.agent_selected, rd.confidence, rd.reasoning, rd.created_at, rc.tokens_used, rc.cost_usd
         FROM routing_decisions rd
         LEFT JOIN routing_costs rc ON rd.id = rc.routing_decision_id
         WHERE rd.session_id = $1
         ORDER BY rd.created_at DESC`,
        [sessionId]
      );
      const hasHistory = historyResult.rows.length > 0;
      updateResult(5, {
        status: hasHistory ? 'passed' : 'failed',
        message: hasHistory ? `Found ${historyResult.rows.length} routing decision(s)` : 'No routing history found',
        duration: Date.now() - start6,
      });

      // Test 7: Aggregate session costs
      updateResult(6, { status: 'running' });
      const start7 = Date.now();
      const aggregateResult = await db.query(
        `SELECT
           COUNT(*) as routing_count,
           SUM(tokens_used) as total_tokens,
           SUM(cost_usd) as total_cost
         FROM routing_costs
         WHERE session_id = $1`,
        [sessionId]
      );
      const aggregate = aggregateResult.rows[0];
      const hasAggregate = aggregate.routing_count > 0;
      updateResult(6, {
        status: hasAggregate ? 'passed' : 'failed',
        message: hasAggregate
          ? `Aggregated: ${aggregate.routing_count} routing(s), ${aggregate.total_tokens} tokens, $${parseFloat(aggregate.total_cost).toFixed(6)}`
          : 'Aggregation failed',
        duration: Date.now() - start7,
      });

      // Test 8: Query handoff history
      updateResult(7, { status: 'running' });
      const start8 = Date.now();
      const handoffResult = await db.query(
        `SELECT id, from_agent, to_agent, reason, user_intent, created_at
         FROM agent_handoffs
         WHERE session_id = $1
         ORDER BY created_at DESC`,
        [sessionId]
      );
      const hasHandoffs = handoffResult.rows.length > 0;
      updateResult(7, {
        status: hasHandoffs ? 'passed' : 'failed',
        message: hasHandoffs ? `Found ${handoffResult.rows.length} handoff(s)` : 'No handoffs found',
        duration: Date.now() - start8,
      });
    } catch (error: any) {
      const failedIndex = testResults.findIndex(t => t.status === 'running');
      if (failedIndex !== -1) {
        updateResult(failedIndex, {
          status: 'failed',
          message: error.message || 'Unknown error',
        });
      }
    } finally {
      setIsRunning(false);
    }
  };

  const passedCount = results.filter(r => r.status === 'passed').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const totalCount = results.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Database Integration Tests
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Tests for Supervisor Router database persistence (PGlite)
          </p>

          <div className="mb-8">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isRunning ? 'Running Tests...' : 'Run Database Tests'}
            </button>
          </div>

          {results.length > 0 && (
            <>
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Total:</span>
                    <span className="ml-2 font-bold text-gray-900 dark:text-white">{totalCount}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-400">Passed:</span>
                    <span className="ml-2 font-bold text-green-900 dark:text-green-300">{passedCount}</span>
                  </div>
                  <div>
                    <span className="font-medium text-red-700 dark:text-red-400">Failed:</span>
                    <span className="ml-2 font-bold text-red-900 dark:text-red-300">{failedCount}</span>
                  </div>
                  {!isRunning && totalCount > 0 && (
                    <div className="ml-auto">
                      {failedCount === 0 ? (
                        <span className="text-green-600 dark:text-green-400 font-bold">✅ ALL PASSED</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-bold">❌ SOME FAILED</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      result.status === 'passed'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : result.status === 'failed'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : result.status === 'running'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {result.status === 'passed' && '✅'}
                            {result.status === 'failed' && '❌'}
                            {result.status === 'running' && '⏳'}
                            {result.status === 'pending' && '⏸️'}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            Test {index + 1}: {result.name}
                          </span>
                        </div>
                        {result.message && (
                          <p className="mt-2 ml-9 text-sm text-gray-600 dark:text-gray-400">
                            {result.message}
                          </p>
                        )}
                      </div>
                      {result.duration !== undefined && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-4">
                          {result.duration}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
