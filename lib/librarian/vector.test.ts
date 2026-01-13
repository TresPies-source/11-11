import { cosineSimilarity, rankBySimilarity, validateEmbedding, normalizeVector } from './vector';

async function runTests() {
  console.log('Running vector operation tests...\n');

  let passCount = 0;
  let failCount = 0;

  console.log('Test 1: Cosine similarity - identical vectors');
  try {
    const vec = [1, 2, 3, 4, 5];
    const similarity = cosineSimilarity(vec, vec);
    if (Math.abs(similarity - 1.0) < 0.0001) {
      console.log(`  ✓ PASS (similarity: ${similarity})`);
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected 1.0, got ${similarity}`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 2: Cosine similarity - orthogonal vectors');
  try {
    const vec1 = [1, 0, 0];
    const vec2 = [0, 1, 0];
    const similarity = cosineSimilarity(vec1, vec2);
    if (Math.abs(similarity - 0.0) < 0.0001) {
      console.log(`  ✓ PASS (similarity: ${similarity})`);
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected 0.0, got ${similarity}`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 3: Cosine similarity - opposite vectors');
  try {
    const vec1 = [1, 2, 3];
    const vec2 = [-1, -2, -3];
    const similarity = cosineSimilarity(vec1, vec2);
    if (Math.abs(similarity - (-1.0)) < 0.0001) {
      console.log(`  ✓ PASS (similarity: ${similarity})`);
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected -1.0, got ${similarity}`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 4: Cosine similarity - similar vectors');
  try {
    const vec1 = [1, 2, 3, 4, 5];
    const vec2 = [1, 2, 3, 4, 6];
    const similarity = cosineSimilarity(vec1, vec2);
    if (similarity > 0.95 && similarity < 1.0) {
      console.log(`  ✓ PASS (similarity: ${similarity})`);
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected >0.95 and <1.0, got ${similarity}`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 5: Cosine similarity - zero vector');
  try {
    const vec1 = [1, 2, 3];
    const vec2 = [0, 0, 0];
    const similarity = cosineSimilarity(vec1, vec2);
    if (similarity === 0) {
      console.log(`  ✓ PASS (similarity: ${similarity})`);
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected 0, got ${similarity}`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 6: Cosine similarity - invalid input (different lengths)');
  try {
    const vec1 = [1, 2, 3];
    const vec2 = [1, 2];
    cosineSimilarity(vec1, vec2);
    console.log('  ✗ FAIL: Should have thrown error');
    failCount++;
  } catch (error) {
    console.log('  ✓ PASS (error thrown as expected)');
    passCount++;
  }

  console.log('\nTest 7: Cosine similarity - invalid input (empty arrays)');
  try {
    const vec1: number[] = [];
    const vec2: number[] = [];
    cosineSimilarity(vec1, vec2);
    console.log('  ✗ FAIL: Should have thrown error');
    failCount++;
  } catch (error) {
    console.log('  ✓ PASS (error thrown as expected)');
    passCount++;
  }

  console.log('\nTest 8: rankBySimilarity - filters by threshold');
  try {
    const queryEmbedding = [1, 0, 0];
    const documents = [
      { id: 'doc1', embedding: [1, 0, 0] },
      { id: 'doc2', embedding: [0.8, 0.2, 0] },
      { id: 'doc3', embedding: [0, 1, 0] },
      { id: 'doc4', embedding: [0.5, 0.5, 0] },
    ];
    const results = rankBySimilarity(queryEmbedding, documents, 0.75);
    
    if (results.length === 2 && results[0].id === 'doc1' && results[1].id === 'doc2') {
      console.log(`  ✓ PASS (${results.length} results above threshold)`);
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected 2 results (doc1, doc2), got ${results.length}`);
      console.log(`  Results: ${results.map(r => `${r.id}(${r.similarity.toFixed(2)})`).join(', ')}`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 9: rankBySimilarity - sorts by similarity descending');
  try {
    const queryEmbedding = [1, 0, 0];
    const documents = [
      { id: 'doc1', embedding: [0.5, 0.5, 0] },
      { id: 'doc2', embedding: [1, 0, 0] },
      { id: 'doc3', embedding: [0.8, 0.2, 0] },
    ];
    const results = rankBySimilarity(queryEmbedding, documents, 0.5);
    
    if (results[0].id === 'doc2' && results[1].id === 'doc3' && results[2].id === 'doc1') {
      console.log('  ✓ PASS (sorted correctly)');
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected doc2, doc3, doc1 order`);
      console.log(`  Got: ${results.map(r => r.id).join(', ')}`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 10: rankBySimilarity - handles null embeddings');
  try {
    const queryEmbedding = [1, 0, 0];
    const documents = [
      { id: 'doc1', embedding: [1, 0, 0] },
      { id: 'doc2', embedding: null },
      { id: 'doc3', embedding: [0.8, 0.2, 0] },
    ];
    const results = rankBySimilarity(queryEmbedding, documents, 0.7);
    
    if (results.length === 2 && !results.find(r => r.id === 'doc2')) {
      console.log('  ✓ PASS (null embedding skipped)');
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected 2 results without doc2`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 11: validateEmbedding - valid array');
  try {
    const valid = validateEmbedding([1, 2, 3, 4, 5]);
    if (valid) {
      console.log('  ✓ PASS');
      passCount++;
    } else {
      console.log('  ✗ FAIL: Should be valid');
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 12: validateEmbedding - invalid (empty array)');
  try {
    const valid = validateEmbedding([]);
    if (!valid) {
      console.log('  ✓ PASS');
      passCount++;
    } else {
      console.log('  ✗ FAIL: Should be invalid');
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 13: validateEmbedding - invalid (not array)');
  try {
    const valid = validateEmbedding('not an array');
    if (!valid) {
      console.log('  ✓ PASS');
      passCount++;
    } else {
      console.log('  ✗ FAIL: Should be invalid');
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 14: validateEmbedding - invalid (contains NaN)');
  try {
    const valid = validateEmbedding([1, 2, NaN, 4]);
    if (!valid) {
      console.log('  ✓ PASS');
      passCount++;
    } else {
      console.log('  ✗ FAIL: Should be invalid');
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 15: normalizeVector - unit vector');
  try {
    const vec = [3, 4];
    const normalized = normalizeVector(vec);
    const magnitude = Math.sqrt(normalized[0] ** 2 + normalized[1] ** 2);
    
    if (Math.abs(magnitude - 1.0) < 0.0001 && Math.abs(normalized[0] - 0.6) < 0.0001 && Math.abs(normalized[1] - 0.8) < 0.0001) {
      console.log('  ✓ PASS (magnitude: 1.0)');
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected magnitude 1.0, got ${magnitude}`);
      console.log(`  Vector: [${normalized.join(', ')}]`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 16: normalizeVector - zero vector');
  try {
    const vec = [0, 0, 0];
    const normalized = normalizeVector(vec);
    
    if (normalized.every(v => v === 0)) {
      console.log('  ✓ PASS (returns zero vector)');
      passCount++;
    } else {
      console.log(`  ✗ FAIL: Expected [0, 0, 0], got [${normalized.join(', ')}]`);
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
    console.log('\n✅ All vector tests passed!');
  } else {
    console.log(`\n❌ ${failCount} test(s) failed`);
    process.exit(1);
  }
}

runTests().catch(console.error);
