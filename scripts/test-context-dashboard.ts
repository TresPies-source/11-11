/**
 * Test script for Context Dashboard
 * Creates sample context data and measures token reduction
 */

import { buildContext } from '../lib/context/builder';
import { saveContextSnapshot } from '../lib/context/status';

async function main() {
  console.log('='.repeat(60));
  console.log('Context Dashboard Manual Test');
  console.log('='.repeat(60));
  console.log('');

  const userId = 'test-user-dashboard';
  const sessionId = 'test-session-dashboard-' + Date.now();

  console.log('User ID:', userId);
  console.log('Session ID:', sessionId);
  console.log('');

  // Test 1: Healthy budget (>80%)
  console.log('Test 1: Healthy Budget (>80%)');
  console.log('-'.repeat(60));
  
  const messages1 = [
    { role: 'user', content: 'Help me optimize this React component' },
    { role: 'assistant', content: 'I can help you optimize your React component. First, let me see the code.' },
    { role: 'user', content: 'Here is the component: function MyComponent() { return <div>Hello</div>; }' },
    { role: 'assistant', content: 'This component is already quite optimized. Here are some tips...' },
    { role: 'user', content: 'What about performance?' },
  ];

  const context1 = await buildContext({
    userId,
    sessionId,
    agent: 'supervisor',
    messages: messages1,
    budgetPercent: 90,
  });

  if (!context1) {
    console.error('❌ Failed to build context for healthy budget scenario');
    return;
  }

  console.log('Total Messages:', context1.messages?.length || 0);
  console.log('Total Tokens:', context1.totalTokens);
  console.log('Budget Remaining:', context1.budgetPercent + '%');
  console.log('Tier Breakdown:');
  console.log('  Tier 1:', context1.tierBreakdown.tier1, 'tokens');
  console.log('  Tier 2:', context1.tierBreakdown.tier2, 'tokens');
  console.log('  Tier 3:', context1.tierBreakdown.tier3, 'tokens');
  console.log('  Tier 4:', context1.tierBreakdown.tier4, 'tokens');
  console.log('');

  await saveContextSnapshot(sessionId, userId, context1);

  console.log('✅ Snapshot saved for healthy budget scenario');
  console.log('');

  // Test 2: Warning budget (40-60%)
  console.log('Test 2: Warning Budget (40-60%)');
  console.log('-'.repeat(60));

  const sessionId2 = 'test-session-dashboard-' + (Date.now() + 1);
  
  const context2 = await buildContext({
    userId,
    sessionId: sessionId2,
    agent: 'supervisor',
    messages: messages1,
    budgetPercent: 50,
  });

  console.log('Total Messages:', context2.messages?.length || 0);
  console.log('Total Tokens:', context2.totalTokens);
  console.log('Budget Remaining:', '50%');
  console.log('Tier Breakdown:');
  console.log('  Tier 1:', context2.tierBreakdown.tier1, 'tokens');
  console.log('  Tier 2:', context2.tierBreakdown.tier2, 'tokens');
  console.log('  Tier 3:', context2.tierBreakdown.tier3, 'tokens');
  console.log('  Tier 4:', context2.tierBreakdown.tier4, 'tokens');
  console.log('');

  await saveContextSnapshot(sessionId2, userId, context2);

  console.log('✅ Snapshot saved for warning budget scenario');
  console.log('');

  // Test 3: Critical budget (<40%)
  console.log('Test 3: Critical Budget (<40%)');
  console.log('-'.repeat(60));

  const sessionId3 = 'test-session-dashboard-' + (Date.now() + 2);
  
  const context3 = await buildContext({
    userId,
    sessionId: sessionId3,
    agent: 'supervisor',
    messages: messages1,
    budgetPercent: 25,
  });

  console.log('Total Messages:', context3.messages?.length || 0);
  console.log('Total Tokens:', context3.totalTokens);
  console.log('Budget Remaining:', '25%');
  console.log('Tier Breakdown:');
  console.log('  Tier 1:', context3.tierBreakdown.tier1, 'tokens');
  console.log('  Tier 2:', context3.tierBreakdown.tier2, 'tokens');
  console.log('  Tier 3:', context3.tierBreakdown.tier3, 'tokens');
  console.log('  Tier 4:', context3.tierBreakdown.tier4, 'tokens');
  console.log('');

  await saveContextSnapshot(sessionId3, userId, context3);

  console.log('✅ Snapshot saved for critical budget scenario');
  console.log('');

  // Token reduction calculation
  console.log('='.repeat(60));
  console.log('Token Reduction Analysis');
  console.log('='.repeat(60));
  console.log('');

  const originalTokens = 10000; // Simulated original context size
  const healthyTokens = context1.totalTokens;
  const warningTokens = context2.totalTokens;
  const criticalTokens = context3.totalTokens;

  console.log('Original (no pruning):      ', originalTokens, 'tokens');
  console.log('Healthy budget (>80%):      ', healthyTokens, 'tokens', `(${((1 - healthyTokens / originalTokens) * 100).toFixed(1)}% reduction)`);
  console.log('Warning budget (40-60%):    ', warningTokens, 'tokens', `(${((1 - warningTokens / originalTokens) * 100).toFixed(1)}% reduction)`);
  console.log('Critical budget (<40%):     ', criticalTokens, 'tokens', `(${((1 - criticalTokens / originalTokens) * 100).toFixed(1)}% reduction)`);
  console.log('');

  console.log('='.repeat(60));
  console.log('✅ Test Complete!');
  console.log('='.repeat(60));
  console.log('');
  console.log('To view the dashboard with this data:');
  console.log('1. Open: http://localhost:3000/context-dashboard');
  console.log('2. Use session ID:', sessionId);
  console.log('');
}

main().catch(console.error);
