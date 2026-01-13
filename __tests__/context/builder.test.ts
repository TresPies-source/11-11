import { buildContext, calculateTokenSavings } from '../../lib/context/builder';
import { buildTier1, buildTier2, buildTier3, buildTier4 } from '../../lib/context/tiers';
import { countTokens, countMessageTokens } from '../../lib/context/tokens';
import { getPruningStrategy } from '../../lib/context/pruning';
import type { ContextBuildOptions } from '../../lib/context/types';

async function runTests() {
  console.log('Running Context Builder tests...\n');

  const testUserId = 'test-user-' + Date.now();
  const testSessionId = 'test-session-' + Date.now();

  console.log('Test 1: Token counting - basic text');
  try {
    const text = 'Hello world, this is a test message.';
    const tokenCount = countTokens(text);
    const pass = tokenCount > 0 && tokenCount < 20;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Token count: ${tokenCount}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 2: Token counting - messages');
  try {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'How are you?' },
    ];
    const tokenCount = countMessageTokens(messages);
    const pass = tokenCount > 0 && tokenCount < 50;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Token count: ${tokenCount}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 3: Pruning strategy - healthy budget (>80%)');
  try {
    const strategy = getPruningStrategy(90);
    const pass = 
      strategy.budgetRange === '>80%' &&
      strategy.tier2Items === 'all' &&
      strategy.tier3Mode === 'full' &&
      strategy.tier4Messages === 10;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Strategy: ${JSON.stringify(strategy)}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 4: Pruning strategy - caution budget (60-80%)');
  try {
    const strategy = getPruningStrategy(70);
    const pass = 
      strategy.budgetRange === '60-80%' &&
      strategy.tier2Items === 'all' &&
      strategy.tier3Mode === 'full' &&
      strategy.tier4Messages === 5;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Strategy: ${JSON.stringify(strategy)}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 5: Pruning strategy - warning budget (40-60%)');
  try {
    const strategy = getPruningStrategy(50);
    const pass = 
      strategy.budgetRange === '40-60%' &&
      strategy.tier2Items === 3 &&
      strategy.tier3Mode === 'summary' &&
      strategy.tier4Messages === 2;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Strategy: ${JSON.stringify(strategy)}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 6: Pruning strategy - critical budget (<40%)');
  try {
    const strategy = getPruningStrategy(30);
    const pass = 
      strategy.budgetRange === '<40%' &&
      strategy.tier2Items === 1 &&
      strategy.tier3Mode === 'none' &&
      strategy.tier4Messages === 0;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Strategy: ${JSON.stringify(strategy)}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 7: Tier 1 builder - always includes core context');
  try {
    const options: ContextBuildOptions = {
      agent: 'supervisor',
      messages: [{ role: 'user', content: 'What is the weather?' }],
      userId: testUserId,
    };
    const tier1 = buildTier1(options);
    const pass = 
      tier1.tier === 'tier1' &&
      tier1.tokenCount > 0 &&
      tier1.content.includes('Supervisor') &&
      tier1.content.includes('What is the weather?');
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Tokens: ${tier1.tokenCount}, Source: ${tier1.source}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 8: Tier 4 builder - prunes conversation history');
  try {
    const messages = [
      { role: 'user', content: 'Message 1' },
      { role: 'assistant', content: 'Response 1' },
      { role: 'user', content: 'Message 2' },
      { role: 'assistant', content: 'Response 2' },
      { role: 'user', content: 'Message 3' },
      { role: 'assistant', content: 'Response 3' },
      { role: 'user', content: 'Current query' },
    ];
    const options: ContextBuildOptions = {
      agent: 'dojo',
      messages,
      userId: testUserId,
    };
    const strategy = getPruningStrategy(70);
    const tier4 = buildTier4(options, strategy);
    const pass = 
      tier4.tier === 'tier4' &&
      tier4.tokenCount > 0 &&
      !tier4.content.includes('Current query');
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Tokens: ${tier4.tokenCount}, Max messages: ${strategy.tier4Messages}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 9: Tier 4 builder - respects 0 message limit');
  try {
    const messages = [
      { role: 'user', content: 'Message 1' },
      { role: 'user', content: 'Message 2' },
    ];
    const options: ContextBuildOptions = {
      agent: 'dojo',
      messages,
      userId: testUserId,
    };
    const strategy = getPruningStrategy(30);
    const tier4 = buildTier4(options, strategy);
    const pass = 
      tier4.tier === 'tier4' &&
      tier4.tokenCount === 0 &&
      tier4.content === '';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Tokens: ${tier4.tokenCount}, Content empty: ${tier4.content === ''}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 10: Build context - healthy budget');
  try {
    const options: ContextBuildOptions = {
      agent: 'supervisor',
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
        { role: 'user', content: 'Help me with budgeting' },
      ],
      userId: testUserId,
      sessionId: testSessionId,
      budgetPercent: 90,
    };
    const result = await buildContext(options);
    const pass = 
      result.messages.length > 0 &&
      result.totalTokens > 0 &&
      result.tierBreakdown.tier1 > 0 &&
      result.pruningStrategy.budgetRange === '>80%';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Messages: ${result.messages.length}, Total tokens: ${result.totalTokens}`);
    console.log(`  Tier breakdown: T1=${result.tierBreakdown.tier1}, T2=${result.tierBreakdown.tier2}, T3=${result.tierBreakdown.tier3}, T4=${result.tierBreakdown.tier4}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 11: Build context - critical budget');
  try {
    const options: ContextBuildOptions = {
      agent: 'dojo',
      messages: [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' },
        { role: 'user', content: 'Message 2' },
      ],
      userId: testUserId,
      budgetPercent: 20,
    };
    const result = await buildContext(options);
    const pass = 
      result.messages.length > 0 &&
      result.tierBreakdown.tier1 > 0 &&
      result.tierBreakdown.tier4 === 0 &&
      result.pruningStrategy.budgetRange === '<40%';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Messages: ${result.messages.length}, Total tokens: ${result.totalTokens}`);
    console.log(`  Strategy: ${result.pruningStrategy.budgetRange}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 12: Build context - never loses tier 1');
  try {
    const options: ContextBuildOptions = {
      agent: 'debugger',
      messages: [{ role: 'user', content: 'Test query' }],
      userId: testUserId,
      budgetPercent: 0,
    };
    const result = await buildContext(options);
    const pass = 
      result.tierBreakdown.tier1 > 0 &&
      result.messages.some(m => m.role === 'system');
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Tier 1 tokens: ${result.tierBreakdown.tier1} (should never be 0)`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 13: Calculate token savings');
  try {
    const originalTokens = 10000;
    const contextResult = {
      messages: [],
      tiers: [],
      totalTokens: 6000,
      tierBreakdown: { tier1: 2000, tier2: 2000, tier3: 1000, tier4: 1000 },
      pruningStrategy: getPruningStrategy(70),
      budgetPercent: 70,
    };
    const savings = calculateTokenSavings(originalTokens, contextResult);
    const pass = 
      savings.savedTokens === 4000 &&
      Math.abs(savings.percentSaved - 40) < 0.1;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Saved tokens: ${savings.savedTokens}, Percent saved: ${savings.percentSaved.toFixed(1)}%`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 14: Build context - force include tiers');
  try {
    const options: ContextBuildOptions = {
      agent: 'supervisor',
      messages: [{ role: 'user', content: 'Test' }],
      userId: testUserId,
      budgetPercent: 20,
      forceIncludeTiers: ['tier2', 'tier3'],
    };
    const result = await buildContext(options);
    const hasTier2 = result.tiers.some(t => t.tier === 'tier2');
    const hasTier3 = result.tiers.some(t => t.tier === 'tier3');
    const pass = hasTier2 && hasTier3;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Includes tier2: ${hasTier2}, Includes tier3: ${hasTier3}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 15: Build context - empty messages');
  try {
    const options: ContextBuildOptions = {
      agent: 'librarian',
      messages: [],
      userId: testUserId,
      budgetPercent: 80,
    };
    const result = await buildContext(options);
    const pass = 
      result.messages.length >= 1 &&
      result.totalTokens > 0;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Messages: ${result.messages.length}, Total tokens: ${result.totalTokens}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('\n===== All Context Builder Tests Complete =====\n');
}

runTests().catch(console.error);
