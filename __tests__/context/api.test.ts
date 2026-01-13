import { 
  getContextStatus, 
  calculateTierBreakdown, 
  saveContextSnapshot,
  getRecentSnapshots,
  getSessionSnapshots 
} from '../../lib/context/status';
import type { ContextResult } from '../../lib/context/types';
import { getPruningStrategy } from '../../lib/context/pruning';

async function runTests() {
  console.log('Running Context Status API tests...\n');

  const testUserId = 'test-user-' + Date.now();
  const testSessionId = 'test-session-' + Date.now();

  console.log('Test 1: Calculate tier breakdown - empty context');
  try {
    const contextResult: ContextResult = {
      messages: [],
      tiers: [],
      totalTokens: 0,
      tierBreakdown: { tier1: 0, tier2: 0, tier3: 0, tier4: 0 },
      pruningStrategy: getPruningStrategy(100),
      budgetPercent: 100,
    };
    
    const breakdown = calculateTierBreakdown(contextResult);
    const pass = 
      breakdown.tier1.tokens === 0 &&
      breakdown.tier2.tokens === 0 &&
      breakdown.tier3.tokens === 0 &&
      breakdown.tier4.tokens === 0 &&
      breakdown.total === 0;
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Breakdown: ${JSON.stringify(breakdown)}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 2: Calculate tier breakdown - with tokens');
  try {
    const contextResult: ContextResult = {
      messages: [],
      tiers: [
        { tier: 'tier1', content: 'System prompt', tokenCount: 100, source: 'system' },
        { tier: 'tier2', content: 'Active seeds', tokenCount: 50, source: 'seeds' },
        { tier: 'tier4', content: 'History', tokenCount: 200, source: 'history' },
      ],
      totalTokens: 350,
      tierBreakdown: { tier1: 100, tier2: 50, tier3: 0, tier4: 200 },
      pruningStrategy: getPruningStrategy(100),
      budgetPercent: 100,
    };
    
    const breakdown = calculateTierBreakdown(contextResult);
    const pass = 
      breakdown.tier1.tokens === 100 &&
      breakdown.tier2.tokens === 50 &&
      breakdown.tier3.tokens === 0 &&
      breakdown.tier4.tokens === 200 &&
      breakdown.total === 350;
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Breakdown: ${JSON.stringify(breakdown)}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 3: Save context snapshot');
  try {
    const contextResult: ContextResult = {
      messages: [],
      tiers: [
        { tier: 'tier1', content: 'System prompt', tokenCount: 100, source: 'system' },
        { tier: 'tier2', content: 'Active seeds', tokenCount: 50, source: 'seeds' },
      ],
      totalTokens: 150,
      tierBreakdown: { tier1: 100, tier2: 50, tier3: 0, tier4: 0 },
      pruningStrategy: getPruningStrategy(90),
      budgetPercent: 90,
    };
    
    await saveContextSnapshot(testSessionId, testUserId, contextResult);
    console.log(`  Status: ✓ PASS`);
    console.log(`  Snapshot saved successfully`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 4: Get context status - returns saved snapshot');
  try {
    const status = await getContextStatus(testSessionId, testUserId);
    
    const checks = {
      notNull: status !== null,
      sessionId: status?.sessionId === testSessionId,
      tokens: status?.currentContext.totalTokens === 150,
      budget: status?.budgetPercent === 90,
    };
    
    const pass = Object.values(checks).every(v => v);
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    if (status) {
      console.log(`  Checks: ${JSON.stringify(checks)}`);
      console.log(`  Budget: ${status.budgetPercent} (type: ${typeof status.budgetPercent}) vs 90 (type: ${typeof 90})`);
      console.log(`  Budget strict eq: ${status.budgetPercent === 90}`);
      console.log(`  Budget loose eq: ${status.budgetPercent == 90}`);
    } else {
      console.log(`  Status is null (unexpected)`);
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 5: Get context status - nonexistent session');
  try {
    const status = await getContextStatus('nonexistent-session', testUserId);
    const pass = status === null;
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Correctly returned null for nonexistent session`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 6: Get recent snapshots');
  try {
    const snapshots = await getRecentSnapshots(testUserId, 5);
    const pass = Array.isArray(snapshots) && snapshots.length > 0;
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Found ${snapshots.length} snapshot(s)`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 7: Get session snapshots');
  try {
    const snapshots = await getSessionSnapshots(testSessionId);
    const pass = Array.isArray(snapshots) && snapshots.length > 0;
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Found ${snapshots.length} snapshot(s) for session`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 8: Save multiple snapshots - order verification');
  try {
    const testSessionId2 = 'test-session-2-' + Date.now();
    
    for (let i = 0; i < 3; i++) {
      const contextResult: ContextResult = {
        messages: [],
        tiers: [
          { tier: 'tier1', content: `Iteration ${i}`, tokenCount: 100 + i * 10, source: 'system' },
        ],
        totalTokens: 100 + i * 10,
        tierBreakdown: { tier1: 100 + i * 10, tier2: 0, tier3: 0, tier4: 0 },
        pruningStrategy: getPruningStrategy(90 - i * 10),
        budgetPercent: 90 - i * 10,
      };
      
      await saveContextSnapshot(testSessionId2, testUserId, contextResult);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const snapshots = await getSessionSnapshots(testSessionId2);
    const pass = 
      snapshots.length === 3 &&
      snapshots[0].total_tokens === 100 &&
      snapshots[2].total_tokens === 120;
    
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Snapshots ordered correctly (${snapshots.length} total)`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('✅ All Context Status API tests completed!\n');
}

runTests().catch(console.error);
