import { MODEL_REGISTRY, getModelForAgent, calculateCost } from '../lib/llm/registry';
import { MODEL_PRICING } from '../lib/cost/constants';

console.log('=== Model Registry Verification ===\n');

console.log('1. Model Pricing Configuration:');
Object.entries(MODEL_REGISTRY).forEach(([name, config]) => {
  console.log(`\n${name}:`);
  console.log(`  Provider: ${config.provider}`);
  console.log(`  Context Window: ${config.contextWindow} tokens`);
  console.log(`  Max Output: ${config.maxOutput} tokens`);
  console.log(`  Input: $${config.cost.input}/1M tokens`);
  console.log(`  Output: $${config.cost.output}/1M tokens`);
  if (config.cost.inputCached) {
    console.log(`  Input (cached): $${config.cost.inputCached}/1M tokens`);
  }
  console.log(`  Recommended for: ${config.recommendedFor.join(', ')}`);
});

console.log('\n\n2. Agent Routing Configuration:');
const agents = ['supervisor', 'librarian', 'cost-guard', 'dojo', 'debugger'];
agents.forEach(agent => {
  const model = getModelForAgent(agent);
  const config = MODEL_REGISTRY[model];
  console.log(`${agent} → ${model} (${config.provider})`);
});

console.log('\n\n3. Cost Calculation Test:');
const testUsage = { prompt_tokens: 1000, completion_tokens: 500 };
Object.keys(MODEL_REGISTRY).forEach(modelName => {
  const cost = calculateCost(modelName, testUsage);
  console.log(`${modelName}: $${cost.toFixed(6)} (1000 input + 500 output tokens)`);
});

console.log('\n\n4. Pricing Consistency Check (MODEL_REGISTRY vs MODEL_PRICING):');
Object.entries(MODEL_REGISTRY).forEach(([name, config]) => {
  const pricingEntry = MODEL_PRICING[name];
  if (!pricingEntry) {
    console.log(`❌ ${name}: Not found in MODEL_PRICING`);
    return;
  }
  
  const inputMatch = pricingEntry.input_price_per_1m === config.cost.input;
  const outputMatch = pricingEntry.output_price_per_1m === config.cost.output;
  
  if (inputMatch && outputMatch) {
    console.log(`✅ ${name}: Pricing matches`);
  } else {
    console.log(`❌ ${name}: Pricing mismatch`);
    console.log(`   Registry: $${config.cost.input}/$${config.cost.output}`);
    console.log(`   Constants: $${pricingEntry.input_price_per_1m}/$${pricingEntry.output_price_per_1m}`);
  }
});

console.log('\n=== Verification Complete ===');
