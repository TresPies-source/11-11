#!/usr/bin/env tsx

/**
 * Test script to verify dev mode fallback works without API keys
 * 
 * This script tests the keyword-based routing that activates when:
 * - No DEEPSEEK_API_KEY configured
 * - No OPENAI_API_KEY configured
 * 
 * Expected behavior:
 * - "search for prompts" → librarian (search keyword)
 * - "fix this error" → debugger (debug keyword)
 * - "help me with task" → dojo (default)
 */

import { routeQuery, getAvailableAgents } from '../lib/agents/supervisor';
import { canUseProvider } from '../lib/llm/client';

async function testDevModeFallback() {
  console.log('='.repeat(60));
  console.log('Dev Mode Fallback Test (No API Keys)');
  console.log('='.repeat(60));
  console.log();

  // Check API key status
  console.log('API Key Status:');
  console.log(`- DeepSeek available: ${canUseProvider('deepseek')}`);
  console.log(`- OpenAI available: ${canUseProvider('openai')}`);
  console.log();

  if (canUseProvider('deepseek') || canUseProvider('openai')) {
    console.warn('⚠️  Warning: API keys are configured. This test is for dev mode without keys.');
    console.warn('   To test keyword fallback, remove API keys from .env.local temporarily.');
    console.log();
  }

  // Get available agents
  const agents = getAvailableAgents();
  console.log(`Available agents: ${agents.map(a => a.id).join(', ')}`);
  console.log();

  // Test cases for keyword-based routing
  const testCases = [
    {
      query: 'search for prompts about budgeting',
      expected: 'librarian',
      reason: 'Contains "search" keyword',
    },
    {
      query: 'find similar prompts',
      expected: 'librarian',
      reason: 'Contains "find" keyword',
    },
    {
      query: 'fix this error in my code',
      expected: 'debugger',
      reason: 'Contains "fix" and "error" keywords',
    },
    {
      query: 'debug this conflict',
      expected: 'debugger',
      reason: 'Contains "debug" and "conflict" keywords',
    },
    {
      query: 'help me with this task',
      expected: 'dojo',
      reason: 'No specific keywords (default)',
    },
    {
      query: 'what should I do next?',
      expected: 'dojo',
      reason: 'No specific keywords (default)',
    },
  ];

  console.log('Test Cases:');
  console.log('-'.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const result = await routeQuery({
        query: testCase.query,
        conversation_context: [],
        available_agents: agents,
        session_id: 'test-session',
      });

      const isCorrect = result.agent_id === testCase.expected;
      const status = isCorrect ? '✅ PASS' : '❌ FAIL';

      console.log(`${status} "${testCase.query}"`);
      console.log(`   Expected: ${testCase.expected}`);
      console.log(`   Got: ${result.agent_id}`);
      console.log(`   Reasoning: ${result.reasoning}`);
      console.log(`   Fallback: ${result.fallback}`);
      console.log();

      if (isCorrect) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ ERROR: ${testCase.query}`);
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
      console.log();
      failed++;
    }
  }

  console.log('='.repeat(60));
  console.log('Test Results:');
  console.log(`- Passed: ${passed}/${testCases.length}`);
  console.log(`- Failed: ${failed}/${testCases.length}`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('✅ All tests passed! Dev mode fallback works correctly.');
  } else {
    console.error('❌ Some tests failed. Check implementation.');
    process.exit(1);
  }
}

testDevModeFallback().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
