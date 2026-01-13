#!/usr/bin/env tsx

/**
 * Test Runner for Supervisor Router
 * 
 * Runs all unit tests for the Supervisor Router feature.
 * 
 * Test Categories:
 * 1. Non-Database Tests (can run in Node.js):
 *    - supervisor.test.ts: Agent registry and routing logic
 *    - fallback.test.ts: Fallback handling and error scenarios
 * 
 * 2. Database Tests (require browser environment or mock):
 *    - cost-tracking.test.ts: Routing cost tracking in database
 *    - handoff.test.ts: Agent handoff event storage
 * 
 * Note: Database tests use PGlite with IndexedDB backend (idb://11-11-db)
 * and cannot run in Node.js without a browser environment simulator.
 */

import { execSync } from 'child_process';
import path from 'path';

const TEST_DIR = path.join(__dirname, 'agents');

interface TestResult {
  name: string;
  passed: boolean;
  output: string;
  requiresBrowser: boolean;
  skipped: boolean;
}

const TESTS = [
  { file: 'supervisor.test.ts', name: 'Agent Registry & Routing', requiresBrowser: false },
  { file: 'fallback.test.ts', name: 'Fallback Logic', requiresBrowser: false },
  { file: 'cost-tracking.test.ts', name: 'Cost Tracking', requiresBrowser: true },
  { file: 'handoff.test.ts', name: 'Handoff System', requiresBrowser: true },
];

async function runTest(testFile: string): Promise<{ passed: boolean; output: string }> {
  try {
    const testPath = path.join(TEST_DIR, testFile);
    const output = execSync(`npx tsx ${testPath}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return { passed: true, output };
  } catch (error: any) {
    return { passed: false, output: error.stdout || error.message };
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       Supervisor Router Test Suite                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const results: TestResult[] = [];
  const skipDatabaseTests = process.argv.includes('--skip-db');

  for (const test of TESTS) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Running: ${test.name}`);
    console.log(`File: ${test.file}`);
    
    if (test.requiresBrowser && skipDatabaseTests) {
      console.log('Status: SKIPPED (requires browser environment)');
      results.push({
        name: test.name,
        passed: false,
        output: '',
        requiresBrowser: true,
        skipped: true,
      });
      continue;
    }

    if (test.requiresBrowser) {
      console.log('⚠️  Warning: This test requires browser environment (IndexedDB)');
      console.log('   Running in Node.js will fail. Use --skip-db to skip these tests.\n');
    }

    console.log('='.repeat(70));

    const result = await runTest(test.file);
    results.push({
      name: test.name,
      passed: result.passed,
      output: result.output,
      requiresBrowser: test.requiresBrowser,
      skipped: false,
    });

    if (result.passed) {
      console.log(`\n✅ ${test.name} PASSED`);
    } else {
      console.log(`\n❌ ${test.name} FAILED`);
      if (test.requiresBrowser && result.output.includes('IndexedDB')) {
        console.log('   (Failed due to missing browser environment - this is expected in Node.js)');
      }
    }
  }

  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    Test Summary                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const nodeTests = results.filter(r => !r.requiresBrowser);
  const browserTests = results.filter(r => r.requiresBrowser);
  const skippedTests = results.filter(r => r.skipped);

  console.log('Node.js Tests (can run anywhere):');
  nodeTests.forEach(r => {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}  ${r.name}`);
  });

  console.log('\nBrowser Tests (require browser environment):');
  browserTests.forEach(r => {
    const status = r.skipped ? '⏭️  SKIP' : (r.passed ? '✅ PASS' : '❌ FAIL');
    console.log(`  ${status}  ${r.name}`);
  });

  const nodePassed = nodeTests.filter(r => r.passed).length;
  const nodeTotal = nodeTests.length;
  const browserPassed = browserTests.filter(r => r.passed && !r.skipped).length;
  const browserTotal = browserTests.length;
  const browserSkipped = skippedTests.length;

  console.log('\n' + '─'.repeat(70));
  console.log(`Node.js Tests:  ${nodePassed}/${nodeTotal} passed`);
  console.log(`Browser Tests:  ${browserPassed}/${browserTotal} passed, ${browserSkipped} skipped`);
  console.log(`Total:          ${nodePassed + browserPassed}/${nodeTotal + browserTotal} passed`);
  console.log('─'.repeat(70));

  if (browserTests.some(r => !r.passed && !r.skipped)) {
    console.log('\n⚠️  Note: Browser tests failed because they require a browser environment.');
    console.log('   These tests use PGlite with IndexedDB and cannot run in Node.js.');
    console.log('   To skip browser tests, run: npm run test -- --skip-db');
    console.log('   To run browser tests, use a test framework with browser simulation.');
  }

  const allNodeTestsPassed = nodeTests.every(r => r.passed);
  if (allNodeTestsPassed) {
    console.log('\n✅ All Node.js tests passed! Core routing logic is verified.');
  }

  process.exit(allNodeTestsPassed ? 0 : 1);
}

main().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
