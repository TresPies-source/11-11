import {
  applyConservativeMode,
  isAllowedInConservativeMode,
  getConservativeModel,
} from '../../lib/safety/conservative-mode';
import type { LLMCallOptions } from '../../lib/llm/types';

async function runTests() {
  console.log('Running Conservative Mode tests...\n');

  console.log('Test 1: getConservativeModel - returns correct model');
  try {
    const model = getConservativeModel();
    const pass = model === 'deepseek-chat';
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Model: ${model}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 2: applyConservativeMode - limits max tokens');
  try {
    const options: LLMCallOptions = {
      maxTokens: 5000,
      temperature: 0.9,
    };
    const conservative = applyConservativeMode(options);
    const pass = (conservative.maxTokens || 0) <= 2000;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Original maxTokens: ${options.maxTokens}`);
    console.log(`  Conservative maxTokens: ${conservative.maxTokens}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 3: applyConservativeMode - removes tools');
  try {
    const options: LLMCallOptions = {
      tools: [
        {
          type: 'function',
          function: {
            name: 'test',
            description: 'test tool',
            parameters: {},
          },
        },
      ],
    };
    const conservative = applyConservativeMode(options);
    const pass = conservative.tools === undefined;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Original tools: ${options.tools?.length || 0}`);
    console.log(`  Conservative tools: ${conservative.tools?.length || 0}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 4: applyConservativeMode - removes responseFormat');
  try {
    const options: LLMCallOptions = {
      responseFormat: { type: 'json_object' },
    };
    const conservative = applyConservativeMode(options);
    const pass = conservative.responseFormat === undefined;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Original responseFormat: ${options.responseFormat?.type}`);
    console.log(`  Conservative responseFormat: ${conservative.responseFormat?.type || 'none'}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 5: isAllowedInConservativeMode - allows mirror mode');
  try {
    const allowed = isAllowedInConservativeMode('mirror');
    const pass = allowed === true;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Mirror mode allowed: ${allowed}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 6: isAllowedInConservativeMode - allows query mode');
  try {
    const allowed = isAllowedInConservativeMode('query');
    const pass = allowed === true;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Query mode allowed: ${allowed}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 7: isAllowedInConservativeMode - blocks scout mode');
  try {
    const allowed = isAllowedInConservativeMode('scout');
    const pass = allowed === false;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Scout mode allowed: ${allowed}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 8: isAllowedInConservativeMode - blocks gardener mode');
  try {
    const allowed = isAllowedInConservativeMode('gardener');
    const pass = allowed === false;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Gardener mode allowed: ${allowed}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Test 9: isAllowedInConservativeMode - blocks implementation mode');
  try {
    const allowed = isAllowedInConservativeMode('implementation');
    const pass = allowed === false;
    console.log(`  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Implementation mode allowed: ${allowed}`);
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
  }
  console.log();

  console.log('Conservative Mode tests complete!\n');
}

runTests();
