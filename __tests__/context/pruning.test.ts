import { getPruningStrategy, applyPruning, pruneConversationHistory } from '../../lib/context/pruning';
import type { ContextResult } from '../../lib/context/types';

async function runTests() {
  console.log('Running Pruning Logic tests...\n');

  console.log('Test 1: Pruning strategy - boundary at 40%');
  try {
    const strategy39 = getPruningStrategy(39);
    const strategy40 = getPruningStrategy(40);
    const pass = 
      strategy39.budgetRange === '<40%' &&
      strategy39.tier4Messages === 0 &&
      strategy40.budgetRange === '40-60%' &&
      strategy40.tier4Messages === 2;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  39%: ${strategy39.budgetRange}, 40%: ${strategy40.budgetRange}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 2: Pruning strategy - boundary at 60%');
  try {
    const strategy59 = getPruningStrategy(59);
    const strategy60 = getPruningStrategy(60);
    const pass = 
      strategy59.budgetRange === '40-60%' &&
      strategy59.tier3Mode === 'summary' &&
      strategy60.budgetRange === '60-80%' &&
      strategy60.tier3Mode === 'full';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  59%: ${strategy59.tier3Mode}, 60%: ${strategy60.tier3Mode}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 3: Pruning strategy - boundary at 80%');
  try {
    const strategy79 = getPruningStrategy(79);
    const strategy80 = getPruningStrategy(80);
    const pass = 
      strategy79.budgetRange === '60-80%' &&
      strategy79.tier4Messages === 5 &&
      strategy80.budgetRange === '>80%' &&
      strategy80.tier4Messages === 10;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  79%: ${strategy79.tier4Messages} msgs, 80%: ${strategy80.tier4Messages} msgs`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 4: Apply pruning - never prunes tier 1');
  try {
    const context: ContextResult = {
      messages: [],
      tiers: [
        { tier: 'tier1', content: 'System prompt and query', tokenCount: 500, source: 'system' },
        { tier: 'tier2', content: 'Seed 1\n\n---\n\nSeed 2', tokenCount: 300, source: 'seeds' },
      ],
      totalTokens: 800,
      tierBreakdown: { tier1: 500, tier2: 300, tier3: 0, tier4: 0 },
      pruningStrategy: getPruningStrategy(80),
      budgetPercent: 80,
    };
    
    const criticalStrategy = getPruningStrategy(20);
    const pruned = applyPruning(context, criticalStrategy);
    
    const tier1 = pruned.tiers.find(t => t.tier === 'tier1');
    const pass = tier1 && tier1.tokenCount === 500;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Tier 1 tokens before: 500, after: ${tier1?.tokenCount}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 5: Apply pruning - prunes tier 2 items');
  try {
    const seeds = Array.from({ length: 10 }, (_, i) => `Seed ${i + 1}`).join('\n\n---\n\n');
    const context: ContextResult = {
      messages: [],
      tiers: [
        { tier: 'tier1', content: 'System', tokenCount: 100, source: 'system' },
        { tier: 'tier2', content: seeds, tokenCount: 1000, source: 'seeds' },
      ],
      totalTokens: 1100,
      tierBreakdown: { tier1: 100, tier2: 1000, tier3: 0, tier4: 0 },
      pruningStrategy: getPruningStrategy(80),
      budgetPercent: 80,
    };
    
    const strategy = getPruningStrategy(50);
    const pruned = applyPruning(context, strategy);
    
    const tier2 = pruned.tiers.find(t => t.tier === 'tier2');
    const pass = tier2 && tier2.tokenCount < 1000;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Tier 2 tokens before: 1000, after: ${tier2?.tokenCount}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 6: Apply pruning - tier 3 to none');
  try {
    const context: ContextResult = {
      messages: [],
      tiers: [
        { tier: 'tier1', content: 'System', tokenCount: 100, source: 'system' },
        { tier: 'tier3', content: 'File content here', tokenCount: 500, source: 'files' },
      ],
      totalTokens: 600,
      tierBreakdown: { tier1: 100, tier2: 0, tier3: 500, tier4: 0 },
      pruningStrategy: getPruningStrategy(80),
      budgetPercent: 80,
    };
    
    const strategy = getPruningStrategy(20);
    const pruned = applyPruning(context, strategy);
    
    const tier3 = pruned.tiers.find(t => t.tier === 'tier3');
    const pass = tier3 && tier3.tokenCount === 0 && tier3.content === '';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Tier 3 tokens before: 500, after: ${tier3?.tokenCount}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 7: Apply pruning - tier 3 to summary');
  try {
    const longContent = Array.from({ length: 30 }, (_, i) => `Line ${i + 1}`).join('\n');
    const context: ContextResult = {
      messages: [],
      tiers: [
        { tier: 'tier1', content: 'System', tokenCount: 100, source: 'system' },
        { tier: 'tier3', content: longContent, tokenCount: 500, source: 'files' },
      ],
      totalTokens: 600,
      tierBreakdown: { tier1: 100, tier2: 0, tier3: 500, tier4: 0 },
      pruningStrategy: getPruningStrategy(80),
      budgetPercent: 80,
    };
    
    const strategy = getPruningStrategy(50);
    const pruned = applyPruning(context, strategy);
    
    const tier3 = pruned.tiers.find(t => t.tier === 'tier3');
    const pass = tier3 && tier3.tokenCount < 500 && tier3.source === 'file_summaries';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Tier 3 tokens before: 500, after: ${tier3?.tokenCount}, source: ${tier3?.source}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 8: Apply pruning - tier 4 message limit');
  try {
    const messages = Array.from({ length: 20 }, (_, i) => `Message ${i + 1}`).join('\n\n');
    const context: ContextResult = {
      messages: [],
      tiers: [
        { tier: 'tier1', content: 'System', tokenCount: 100, source: 'system' },
        { tier: 'tier4', content: messages, tokenCount: 800, source: 'history' },
      ],
      totalTokens: 900,
      tierBreakdown: { tier1: 100, tier2: 0, tier3: 0, tier4: 800 },
      pruningStrategy: getPruningStrategy(80),
      budgetPercent: 80,
    };
    
    const strategy = getPruningStrategy(70);
    const pruned = applyPruning(context, strategy);
    
    const tier4 = pruned.tiers.find(t => t.tier === 'tier4');
    const pass = tier4 && tier4.tokenCount < 800;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Tier 4 tokens before: 800, after: ${tier4?.tokenCount}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 9: Prune conversation history - by recency only');
  try {
    const messages = [
      { role: 'user', content: 'Message 1' },
      { role: 'assistant', content: 'Response 1' },
      { role: 'user', content: 'Message 2' },
      { role: 'assistant', content: 'Response 2' },
      { role: 'user', content: 'Message 3' },
      { role: 'assistant', content: 'Response 3' },
    ];
    
    const pruned = pruneConversationHistory(messages, 3);
    const pass = 
      pruned.length === 3 &&
      pruned[0].content === 'Response 2' &&
      pruned[2].content === 'Response 3';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Original: ${messages.length}, Pruned: ${pruned.length}`);
    console.log(`  First message: "${pruned[0]?.content}"`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 10: Prune conversation history - by relevance + recency');
  try {
    const messages = [
      { role: 'user', content: 'Old but relevant' },
      { role: 'user', content: 'Old and irrelevant' },
      { role: 'user', content: 'Recent but irrelevant' },
      { role: 'user', content: 'Recent and relevant' },
    ];
    const relevanceScores = [0.9, 0.1, 0.2, 0.8];
    
    const pruned = pruneConversationHistory(messages, 2, relevanceScores);
    const pass = 
      pruned.length === 2 &&
      pruned.some(m => m.content === 'Old but relevant' || m.content === 'Recent and relevant');
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Selected: ${pruned.map(m => `"${m.content}"`).join(', ')}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 11: Prune conversation history - no pruning needed');
  try {
    const messages = [
      { role: 'user', content: 'Message 1' },
      { role: 'user', content: 'Message 2' },
    ];
    
    const pruned = pruneConversationHistory(messages, 5);
    const pass = 
      pruned.length === messages.length &&
      pruned[0].content === messages[0].content;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Original: ${messages.length}, Pruned: ${pruned.length} (no pruning)`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('\n===== All Pruning Logic Tests Complete =====\n');
}

runTests().catch(console.error);
