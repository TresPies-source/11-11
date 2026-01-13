import {
  generateEmbedding,
  embedPrompt,
  embedAllPrompts,
  hasEmbedding,
  refreshEmbedding,
} from './embeddings';
import { getDB } from '@/lib/pglite/client';
import { canUseOpenAI } from '@/lib/openai/client';

async function runTests() {
  console.log('Running embedding service tests...\n');
  console.log('NOTE: These tests require a valid OpenAI API key and will make real API calls.\n');

  let passCount = 0;
  let failCount = 0;

  if (!canUseOpenAI()) {
    console.log('⚠️  OpenAI API not available - skipping embedding tests');
    console.log('Set OPENAI_API_KEY in .env.local to run these tests\n');
    return;
  }

  console.log('Test 1: Generate embedding for simple text');
  try {
    const result = await generateEmbedding('Hello world');
    
    if (
      result.embedding &&
      result.embedding.length === 1536 &&
      result.tokens_used > 0 &&
      result.cost_usd > 0 &&
      result.model === 'text-embedding-3-small'
    ) {
      console.log(`  ✓ PASS (${result.embedding.length} dimensions, ${result.tokens_used} tokens, $${result.cost_usd.toFixed(6)})`);
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Invalid result structure`);
      console.log(`  Embedding length: ${result.embedding?.length}, Tokens: ${result.tokens_used}, Cost: $${result.cost_usd}`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 2: Generate embedding for longer text');
  try {
    const longText = 'This is a longer piece of text that should generate a valid embedding. It contains multiple sentences and more complex content to ensure the embedding service works correctly with various input lengths.';
    const result = await generateEmbedding(longText);
    
    if (result.embedding.length === 1536 && result.tokens_used > 10) {
      console.log(`  ✓ PASS (${result.tokens_used} tokens, $${result.cost_usd.toFixed(6)})`);
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected more tokens for longer text`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 3: Embedding validation - no NaN values');
  try {
    const result = await generateEmbedding('Test text for validation');
    
    const hasNaN = result.embedding.some(val => isNaN(val));
    if (!hasNaN) {
      console.log('  ✓ PASS (no NaN values)');
      passCount++;
    } else {
      console.log('  ✗ FAIL: Embedding contains NaN values');
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 4: Embedding validation - values are numbers');
  try {
    const result = await generateEmbedding('Numeric validation test');
    
    const allNumbers = result.embedding.every(val => typeof val === 'number');
    if (allNumbers) {
      console.log('  ✓ PASS (all values are numbers)');
      passCount++;
    } else {
      console.log('  ✗ FAIL: Embedding contains non-numeric values');
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 5: Error handling - empty text');
  try {
    await generateEmbedding('');
    console.log('  ✗ FAIL: Should have thrown error for empty text');
    failCount++;
  } catch (error) {
    if (error instanceof Error && error.message.includes('empty')) {
      console.log('  ✓ PASS (error thrown as expected)');
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Wrong error message: ${error}`);
      failCount++;
    }
  }

  console.log('\nTest 6: Error handling - whitespace only');
  try {
    await generateEmbedding('   ');
    console.log('  ✗ FAIL: Should have thrown error for whitespace');
    failCount++;
  } catch (error) {
    if (error instanceof Error && error.message.includes('empty')) {
      console.log('  ✓ PASS (error thrown as expected)');
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Wrong error message: ${error}`);
      failCount++;
    }
  }

  console.log('\nTest 7: Embeddings are deterministic (same text = same embedding)');
  try {
    const text = 'Deterministic test text';
    const result1 = await generateEmbedding(text);
    const result2 = await generateEmbedding(text);
    
    const areSimilar = result1.embedding.every((val, idx) => 
      Math.abs(val - result2.embedding[idx]) < 0.0001
    );
    
    if (areSimilar) {
      console.log('  ✓ PASS (embeddings are deterministic)');
      passCount++;
    } else {
      console.log('  ✗ FAIL: Embeddings differ for same text');
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 8: Different text produces different embeddings');
  try {
    const result1 = await generateEmbedding('Budget planning for Q1');
    const result2 = await generateEmbedding('Travel itinerary for vacation');
    
    let differenceCount = 0;
    for (let i = 0; i < result1.embedding.length; i++) {
      if (Math.abs(result1.embedding[i] - result2.embedding[i]) > 0.001) {
        differenceCount++;
      }
    }
    
    if (differenceCount > 100) {
      console.log(`  ✓ PASS (${differenceCount} dimensions differ)`);
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Only ${differenceCount} dimensions differ (expected >100)`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 9: Cost calculation is reasonable');
  try {
    const result = await generateEmbedding('Cost test');
    
    if (result.cost_usd > 0 && result.cost_usd < 0.001) {
      console.log(`  ✓ PASS (cost: $${result.cost_usd.toFixed(6)})`);
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Cost seems unreasonable: $${result.cost_usd}`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 10: Embed prompt and store in database');
  try {
    const db = await getDB();
    
    const createResult = await db.query(`
      INSERT INTO prompts (user_id, title, content, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['test_user', 'Test Prompt', 'This is test content for embedding', 'draft']);
    
    const promptId = (createResult.rows[0] as any).id;
    
    const embeddingResult = await embedPrompt(
      promptId,
      'This is test content for embedding',
      'test_user'
    );
    
    const checkResult = await db.query(
      'SELECT embedding FROM prompts WHERE id = $1',
      [promptId]
    );
    
    const stored = (checkResult.rows[0] as any).embedding;
    
    await db.query('DELETE FROM prompts WHERE id = $1', [promptId]);
    
    if (stored && stored.length === 1536) {
      console.log(`  ✓ PASS (embedding stored in database)`);
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Embedding not stored correctly (length: ${stored?.length})`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 11: hasEmbedding returns correct status');
  try {
    const db = await getDB();
    
    const createResult = await db.query(`
      INSERT INTO prompts (user_id, title, content, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['test_user', 'Test Prompt 2', 'Test content', 'draft']);
    
    const promptId = (createResult.rows[0] as any).id;
    
    const hasEmbeddingBefore = await hasEmbedding(promptId);
    
    await embedPrompt(promptId, 'Test content', 'test_user');
    
    const hasEmbeddingAfter = await hasEmbedding(promptId);
    
    await db.query('DELETE FROM prompts WHERE id = $1', [promptId]);
    
    if (!hasEmbeddingBefore && hasEmbeddingAfter) {
      console.log('  ✓ PASS (hasEmbedding works correctly)');
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Before: ${hasEmbeddingBefore}, After: ${hasEmbeddingAfter}`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 12: refreshEmbedding updates existing embedding');
  try {
    const db = await getDB();
    
    const createResult = await db.query(`
      INSERT INTO prompts (user_id, title, content, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['test_user', 'Test Prompt 3', 'Original content', 'draft']);
    
    const promptId = (createResult.rows[0] as any).id;
    
    await embedPrompt(promptId, 'Original content', 'test_user');
    
    const firstResult = await db.query(
      'SELECT embedding FROM prompts WHERE id = $1',
      [promptId]
    );
    const firstEmbedding = (firstResult.rows[0] as any).embedding;
    
    await refreshEmbedding(promptId, 'Updated content', 'test_user');
    
    const secondResult = await db.query(
      'SELECT embedding FROM prompts WHERE id = $1',
      [promptId]
    );
    const secondEmbedding = (secondResult.rows[0] as any).embedding;
    
    await db.query('DELETE FROM prompts WHERE id = $1', [promptId]);
    
    let differenceCount = 0;
    for (let i = 0; i < firstEmbedding.length; i++) {
      if (Math.abs(firstEmbedding[i] - secondEmbedding[i]) > 0.001) {
        differenceCount++;
      }
    }
    
    if (differenceCount > 50) {
      console.log(`  ✓ PASS (embedding updated, ${differenceCount} dimensions changed)`);
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Only ${differenceCount} dimensions changed`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passCount} passed, ${failCount} failed`);
  console.log('='.repeat(50));

  if (failCount === 0) {
    console.log('\n✅ All embedding tests passed!');
  } else {
    console.log(`\n❌ ${failCount} test(s) failed`);
    process.exit(1);
  }
}

runTests().catch(console.error);
