import {
  MODEL_REGISTRY,
  getModelConfig,
  getModelForAgent,
  getFallbackModel,
  listAvailableModels,
  getModelsByProvider,
  calculateCost,
} from './registry';

console.log('Testing LLM Model Registry...\n');

console.log('Test 1: MODEL_REGISTRY contains expected models');
try {
  const expectedModels = ['deepseek-chat', 'deepseek-reasoner', 'gpt-4o-mini', 'gpt-4o'];
  const actualModels = Object.keys(MODEL_REGISTRY);
  
  const allPresent = expectedModels.every(model => actualModels.includes(model));
  if (!allPresent) {
    throw new Error(`Missing models. Expected: ${expectedModels.join(', ')}`);
  }
  
  console.log(`✓ All expected models present: ${actualModels.join(', ')}`);
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 2: getModelConfig returns correct config for deepseek-chat');
try {
  const config = getModelConfig('deepseek-chat');
  
  if (config.provider !== 'deepseek') {
    throw new Error(`Expected provider 'deepseek', got '${config.provider}'`);
  }
  
  if (config.model !== 'deepseek-chat') {
    throw new Error(`Expected model 'deepseek-chat', got '${config.model}'`);
  }
  
  if (config.cost.input !== 0.28) {
    throw new Error(`Expected input cost 0.28, got ${config.cost.input}`);
  }
  
  if (config.cost.output !== 0.42) {
    throw new Error(`Expected output cost 0.42, got ${config.cost.output}`);
  }
  
  if (!config.capabilities.json || !config.capabilities.tools) {
    throw new Error('Expected json and tools capabilities to be true');
  }
  
  console.log('✓ deepseek-chat config is correct');
  console.log(`  Provider: ${config.provider}`);
  console.log(`  Model: ${config.model}`);
  console.log(`  Input cost: $${config.cost.input}/1M tokens`);
  console.log(`  Output cost: $${config.cost.output}/1M tokens`);
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 3: getModelConfig returns correct config for deepseek-reasoner');
try {
  const config = getModelConfig('deepseek-reasoner');
  
  if (config.provider !== 'deepseek') {
    throw new Error(`Expected provider 'deepseek', got '${config.provider}'`);
  }
  
  if (!config.capabilities.thinking) {
    throw new Error('Expected deepseek-reasoner to have thinking capability');
  }
  
  if (config.maxOutput !== 64000) {
    throw new Error(`Expected maxOutput 64000, got ${config.maxOutput}`);
  }
  
  console.log('✓ deepseek-reasoner config is correct');
  console.log(`  Has thinking capability: ${config.capabilities.thinking}`);
  console.log(`  Max output: ${config.maxOutput} tokens`);
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 4: getModelConfig returns correct config for gpt-4o-mini');
try {
  const config = getModelConfig('gpt-4o-mini');
  
  if (config.provider !== 'openai') {
    throw new Error(`Expected provider 'openai', got '${config.provider}'`);
  }
  
  if (!config.capabilities.vision) {
    throw new Error('Expected gpt-4o-mini to have vision capability');
  }
  
  if (config.cost.input !== 0.15) {
    throw new Error(`Expected input cost 0.15, got ${config.cost.input}`);
  }
  
  console.log('✓ gpt-4o-mini config is correct');
  console.log(`  Provider: ${config.provider}`);
  console.log(`  Has vision: ${config.capabilities.vision}`);
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 5: getModelConfig throws error for unknown model');
try {
  getModelConfig('unknown-model');
  console.error('✗ FAIL: Should have thrown error for unknown model');
  process.exit(1);
} catch (error) {
  if (error instanceof Error && error.message.includes('not found in registry')) {
    console.log('✓ Correctly throws error for unknown model');
  } else {
    console.error('✗ FAIL: Wrong error message:', error);
    process.exit(1);
  }
}
console.log();

console.log('Test 6: getModelForAgent returns correct model for each agent');
try {
  const testCases = [
    { agent: 'supervisor', expected: 'deepseek-chat' },
    { agent: 'librarian', expected: 'deepseek-chat' },
    { agent: 'cost-guard', expected: 'deepseek-chat' },
    { agent: 'dojo', expected: 'deepseek-chat' },
    { agent: 'debugger', expected: 'deepseek-reasoner' },
  ];
  
  for (const { agent, expected } of testCases) {
    const model = getModelForAgent(agent);
    if (model !== expected) {
      throw new Error(`Agent '${agent}' expected '${expected}', got '${model}'`);
    }
    console.log(`  ✓ ${agent} → ${model}`);
  }
  
  console.log('✓ All agent model assignments correct');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 7: getModelForAgent returns default for unknown agent');
try {
  const model = getModelForAgent('unknown-agent');
  if (model !== 'deepseek-chat') {
    throw new Error(`Expected default 'deepseek-chat', got '${model}'`);
  }
  console.log('✓ Unknown agent defaults to deepseek-chat');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 8: getFallbackModel returns gpt-4o-mini');
try {
  const fallback = getFallbackModel();
  if (fallback !== 'gpt-4o-mini') {
    throw new Error(`Expected 'gpt-4o-mini', got '${fallback}'`);
  }
  console.log('✓ Fallback model is gpt-4o-mini');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 9: listAvailableModels returns all models');
try {
  const models = listAvailableModels();
  const expectedCount = Object.keys(MODEL_REGISTRY).length;
  
  if (models.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} models, got ${models.length}`);
  }
  
  console.log(`✓ listAvailableModels returns ${models.length} models`);
  console.log(`  Models: ${models.join(', ')}`);
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 10: getModelsByProvider filters by deepseek');
try {
  const deepseekModels = getModelsByProvider('deepseek');
  
  if (!deepseekModels.includes('deepseek-chat')) {
    throw new Error('Missing deepseek-chat');
  }
  
  if (!deepseekModels.includes('deepseek-reasoner')) {
    throw new Error('Missing deepseek-reasoner');
  }
  
  if (deepseekModels.includes('gpt-4o-mini')) {
    throw new Error('Should not include gpt-4o-mini');
  }
  
  console.log(`✓ DeepSeek models: ${deepseekModels.join(', ')}`);
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 11: getModelsByProvider filters by openai');
try {
  const openaiModels = getModelsByProvider('openai');
  
  if (!openaiModels.includes('gpt-4o-mini')) {
    throw new Error('Missing gpt-4o-mini');
  }
  
  if (!openaiModels.includes('gpt-4o')) {
    throw new Error('Missing gpt-4o');
  }
  
  if (openaiModels.includes('deepseek-chat')) {
    throw new Error('Should not include deepseek-chat');
  }
  
  console.log(`✓ OpenAI models: ${openaiModels.join(', ')}`);
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 12: calculateCost for deepseek-chat');
try {
  const usage = { prompt_tokens: 1000, completion_tokens: 500 };
  const cost = calculateCost('deepseek-chat', usage);
  
  const expectedCost = (1000 / 1_000_000) * 0.28 + (500 / 1_000_000) * 0.42;
  
  if (Math.abs(cost - expectedCost) > 0.000001) {
    throw new Error(`Expected ${expectedCost}, got ${cost}`);
  }
  
  console.log('✓ Cost calculation correct for deepseek-chat');
  console.log(`  1000 input + 500 output tokens = $${cost.toFixed(6)}`);
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 13: calculateCost for gpt-4o-mini');
try {
  const usage = { prompt_tokens: 10000, completion_tokens: 2000 };
  const cost = calculateCost('gpt-4o-mini', usage);
  
  const expectedCost = (10000 / 1_000_000) * 0.15 + (2000 / 1_000_000) * 0.60;
  
  if (Math.abs(cost - expectedCost) > 0.000001) {
    throw new Error(`Expected ${expectedCost}, got ${cost}`);
  }
  
  console.log('✓ Cost calculation correct for gpt-4o-mini');
  console.log(`  10000 input + 2000 output tokens = $${cost.toFixed(6)}`);
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 14: calculateCost for zero tokens');
try {
  const usage = { prompt_tokens: 0, completion_tokens: 0 };
  const cost = calculateCost('deepseek-chat', usage);
  
  if (cost !== 0) {
    throw new Error(`Expected 0, got ${cost}`);
  }
  
  console.log('✓ Cost is 0 for zero tokens');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 15: calculateCost for large token counts');
try {
  const usage = { prompt_tokens: 100000, completion_tokens: 50000 };
  const cost = calculateCost('deepseek-chat', usage);
  
  const expectedCost = (100000 / 1_000_000) * 0.28 + (50000 / 1_000_000) * 0.42;
  
  if (Math.abs(cost - expectedCost) > 0.000001) {
    throw new Error(`Expected ${expectedCost}, got ${cost}`);
  }
  
  console.log('✓ Cost calculation correct for large token counts');
  console.log(`  100K input + 50K output tokens = $${cost.toFixed(6)}`);
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 16: Model capabilities validation');
try {
  const deepseekChat = getModelConfig('deepseek-chat');
  const deepseekReasoner = getModelConfig('deepseek-reasoner');
  const gpt4oMini = getModelConfig('gpt-4o-mini');
  
  if (!deepseekChat.capabilities.json) {
    throw new Error('deepseek-chat should have JSON capability');
  }
  
  if (!deepseekChat.capabilities.tools) {
    throw new Error('deepseek-chat should have tools capability');
  }
  
  if (deepseekChat.capabilities.thinking) {
    throw new Error('deepseek-chat should NOT have thinking capability');
  }
  
  if (!deepseekReasoner.capabilities.thinking) {
    throw new Error('deepseek-reasoner SHOULD have thinking capability');
  }
  
  if (!gpt4oMini.capabilities.vision) {
    throw new Error('gpt-4o-mini should have vision capability');
  }
  
  console.log('✓ All model capabilities correctly configured');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 17: Cost comparison between models');
try {
  const usage = { prompt_tokens: 10000, completion_tokens: 5000 };
  
  const deepseekCost = calculateCost('deepseek-chat', usage);
  const openaiCost = calculateCost('gpt-4o-mini', usage);
  const gpt4oCost = calculateCost('gpt-4o', usage);
  
  console.log('✓ Cost comparison for 10K input + 5K output:');
  console.log(`  deepseek-chat: $${deepseekCost.toFixed(6)}`);
  console.log(`  gpt-4o-mini: $${openaiCost.toFixed(6)}`);
  console.log(`  gpt-4o: $${gpt4oCost.toFixed(6)}`);
  
  if (deepseekCost <= openaiCost) {
    const savingsVsGpt4oMini = ((openaiCost - deepseekCost) / openaiCost * 100).toFixed(1);
    console.log(`  Savings (deepseek vs gpt-4o-mini): ${savingsVsGpt4oMini}%`);
  } else {
    const extraCost = ((deepseekCost - openaiCost) / openaiCost * 100).toFixed(1);
    console.log(`  Note: Without caching, deepseek is ${extraCost}% more expensive`);
    console.log(`  Real savings (20-35%) come from cache hits (0.028 vs 0.28 input cost)`);
  }
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('✅ All registry tests passed!\n');
