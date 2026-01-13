/**
 * Unit tests for suggestions module.
 */

import { getDB } from '@/lib/pglite/client';
import {
  generateSuggestions,
  getSuggestionsForPrompt,
  getSuggestionsForPageLoad,
} from './suggestions';
import { embedPrompt } from './embeddings';
import type { PromptInsert } from '@/lib/pglite/types';

const TEST_USER_ID = 'test-user-suggestions';
let testPromptIds: { budget1: string; budget2: string; coding1: string; coding2: string; recent1: string } = {
  budget1: '',
  budget2: '',
  coding1: '',
  coding2: '',
  recent1: '',
};

async function setupTestData() {
  console.log('Setting up test data...');
  const db = await getDB();

  await db.query('DELETE FROM prompts WHERE user_id = $1', [TEST_USER_ID]);

  const testPrompts = [
    {
      title: 'Monthly Budget Planning',
      content: 'Create a comprehensive monthly budget plan for personal finance management.',
      status: 'active',
      key: 'budget1' as const,
    },
    {
      title: 'Annual Budget Review',
      content: 'Review annual budget performance and identify areas for improvement.',
      status: 'active',
      key: 'budget2' as const,
    },
    {
      title: 'Python Best Practices',
      content: 'List the top 10 Python coding best practices for clean code.',
      status: 'draft',
      key: 'coding1' as const,
    },
    {
      title: 'TypeScript Patterns',
      content: 'Explain common TypeScript design patterns for enterprise applications.',
      status: 'active',
      key: 'coding2' as const,
    },
    {
      title: 'Recent Work Item',
      content: 'This prompt was just updated.',
      status: 'active',
      key: 'recent1' as const,
    },
  ];

  for (const prompt of testPrompts) {
    const result = await db.query(
      `INSERT INTO prompts (user_id, title, content, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id`,
      [TEST_USER_ID, prompt.title, prompt.content, prompt.status]
    );

    const promptId = (result.rows[0] as { id: string }).id;
    testPromptIds[prompt.key] = promptId;

    await db.query(
      `INSERT INTO prompt_metadata (prompt_id, tags, is_public)
       VALUES ($1, $2, $3)`,
      [promptId, prompt.key.includes('budget') ? ['finance'] : ['coding'], false]
    );
  }

  await db.query(
    `UPDATE prompts SET updated_at = NOW() - INTERVAL '2 hours' WHERE id = $1`,
    [testPromptIds.recent1]
  );
  await db.query(
    `UPDATE prompts SET updated_at = NOW() - INTERVAL '5 days' WHERE id = $1`,
    [testPromptIds.budget1]
  );

  console.log('Generating embeddings...');
  for (const prompt of testPrompts) {
    try {
      await embedPrompt(testPromptIds[prompt.key], prompt.content, TEST_USER_ID);
    } catch (error) {
      console.warn(`Skipping embedding for ${prompt.title} (OpenAI may not be available)`);
    }
  }

  console.log('✓ Test data ready\n');
}

async function cleanupTestData() {
  const db = await getDB();
  await db.query('DELETE FROM prompts WHERE user_id = $1', [TEST_USER_ID]);
}

async function runTests() {
  console.log('Running suggestions module tests...\n');

  let passCount = 0;
  let failCount = 0;

  await setupTestData();

  console.log('Test 1: Generate suggestions without prompt ID');
  try {
    const result = await generateSuggestions(TEST_USER_ID, {
      trigger: 'page_load',
      limit: 5,
    });

    if (!result.suggestions) {
      throw new Error('suggestions field missing');
    }
    if (!Array.isArray(result.suggestions)) {
      throw new Error('suggestions is not an array');
    }
    if (result.suggestions.length === 0) {
      throw new Error('no suggestions generated');
    }
    if (result.suggestions.length > 5) {
      throw new Error(`too many suggestions: ${result.suggestions.length}`);
    }
    if (result.context.user_id !== TEST_USER_ID) {
      throw new Error('wrong user_id');
    }
    if (result.context.trigger !== 'page_load') {
      throw new Error('wrong trigger');
    }
    if (!result.generated_at) {
      throw new Error('generated_at missing');
    }

    console.log(`  ✓ PASS (${result.suggestions.length} suggestions)`);
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 2: Generate suggestions with prompt ID');
  try {
    const result = await generateSuggestions(TEST_USER_ID, {
      promptId: testPromptIds.budget1,
      trigger: 'prompt_save',
      limit: 5,
    });

    if (result.suggestions.length === 0) {
      throw new Error('no suggestions generated');
    }
    if (result.context.prompt_id !== testPromptIds.budget1) {
      throw new Error('wrong prompt_id');
    }

    console.log(`  ✓ PASS (${result.suggestions.length} suggestions)`);
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 3: Respect limit parameter');
  try {
    const result = await generateSuggestions(TEST_USER_ID, {
      limit: 3,
    });

    if (result.suggestions.length > 3) {
      throw new Error(`exceeded limit: ${result.suggestions.length}`);
    }

    console.log(`  ✓ PASS (${result.suggestions.length} <= 3)`);
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 4: Filter by include_types (recent_work)');
  try {
    const result = await generateSuggestions(TEST_USER_ID, {
      includeTypes: ['recent_work'],
      limit: 5,
    });

    for (const s of result.suggestions) {
      if (s.type !== 'recent_work') {
        throw new Error(`wrong type: ${s.type}`);
      }
    }

    console.log(`  ✓ PASS (all recent_work)`);
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 5: Generate similar prompts with embeddings');
  const db = await getDB();
  const embeddingCheck = await db.query(
    'SELECT COUNT(*) as count FROM prompts WHERE user_id = $1 AND embedding IS NOT NULL',
    [TEST_USER_ID]
  );
  const hasEmbeddings = (embeddingCheck.rows[0] as { count: number }).count > 0;
  
  if (!hasEmbeddings) {
    console.log('  ⚠️  SKIP: No embeddings available (OPENAI_API_KEY not set)');
  } else {
    try {
      const result = await generateSuggestions(TEST_USER_ID, {
        promptId: testPromptIds.budget1,
        includeTypes: ['similar_prompt'],
        limit: 5,
      });

      const similarSuggestions = result.suggestions.filter(s => s.type === 'similar_prompt');
      
      if (similarSuggestions.length === 0) {
        throw new Error('no similar suggestions');
      }

      for (const s of similarSuggestions) {
        if (s.similarity === undefined) {
          throw new Error('similarity missing');
        }
        if (s.similarity < 0 || s.similarity > 1) {
          throw new Error(`invalid similarity: ${s.similarity}`);
        }
        if (!s.description.includes('%')) {
          throw new Error('description missing percentage');
        }
      }

      console.log(`  ✓ PASS (${similarSuggestions.length} similar suggestions)`);
      passCount++;
    } catch (error) {
      console.log(`  ✗ FAIL: ${error}`);
      failCount++;
    }
  }

  console.log('\nTest 6: Generate recent work suggestions');
  try {
    const result = await generateSuggestions(TEST_USER_ID, {
      includeTypes: ['recent_work'],
      limit: 5,
    });

    const recentSuggestions = result.suggestions.filter(s => s.type === 'recent_work');
    if (recentSuggestions.length === 0) {
      throw new Error('no recent suggestions');
    }

    for (const s of recentSuggestions) {
      if (s.action !== 'Open') {
        throw new Error(`wrong action: ${s.action}`);
      }
      if (!s.description.match(/ago|just now/)) {
        throw new Error('description missing time');
      }
      if (!s.metadata?.updated_at) {
        throw new Error('updated_at missing');
      }
    }

    console.log(`  ✓ PASS (${recentSuggestions.length} recent suggestions)`);
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 7: Exclude current prompt from recent work');
  try {
    const result = await generateSuggestions(TEST_USER_ID, {
      promptId: testPromptIds.recent1,
      includeTypes: ['recent_work'],
      limit: 5,
    });

    const recentSuggestions = result.suggestions.filter(s => s.type === 'recent_work');
    for (const s of recentSuggestions) {
      if (s.target_id === testPromptIds.recent1) {
        throw new Error('current prompt not excluded');
      }
    }

    console.log(`  ✓ PASS (excluded current prompt)`);
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 8: Handle user with no prompts');
  try {
    const result = await generateSuggestions('nonexistent-user', {
      limit: 5,
    });

    if (!Array.isArray(result.suggestions)) {
      throw new Error('suggestions not an array');
    }
    if (result.suggestions.length !== 0) {
      throw new Error('expected empty suggestions');
    }

    console.log('  ✓ PASS (empty suggestions)');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 9: getSuggestionsForPrompt wrapper');
  try {
    const result = await getSuggestionsForPrompt(testPromptIds.budget1, TEST_USER_ID, 3);

    if (result.context.prompt_id !== testPromptIds.budget1) {
      throw new Error('wrong prompt_id');
    }
    if (result.context.trigger !== 'prompt_save') {
      throw new Error('wrong trigger');
    }
    if (result.suggestions.length > 3) {
      throw new Error('limit not respected');
    }

    console.log(`  ✓ PASS (${result.suggestions.length} suggestions)`);
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 10: getSuggestionsForPageLoad wrapper');
  try {
    const result = await getSuggestionsForPageLoad(TEST_USER_ID, 5);

    if (result.context.trigger !== 'page_load') {
      throw new Error('wrong trigger');
    }
    if (result.suggestions.length > 5) {
      throw new Error('limit not respected');
    }

    console.log(`  ✓ PASS (${result.suggestions.length} suggestions)`);
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 11: Suggestion structure (similar_prompt)');
  if (!hasEmbeddings) {
    console.log('  ⚠️  SKIP: No embeddings available (OPENAI_API_KEY not set)');
  } else {
    try {
      const result = await generateSuggestions(TEST_USER_ID, {
        promptId: testPromptIds.budget1,
        includeTypes: ['similar_prompt'],
      });

      const similarSuggestions = result.suggestions.filter(s => s.type === 'similar_prompt');
      
      if (similarSuggestions.length > 0) {
        const s = similarSuggestions[0];
        if (!s.title) throw new Error('title missing');
        if (!s.description.includes('%')) throw new Error('description missing %');
        if (s.action !== 'View') throw new Error('wrong action');
        if (!s.target_id) throw new Error('target_id missing');
        if (s.similarity === undefined) throw new Error('similarity missing');
        if (!s.metadata) throw new Error('metadata missing');
      }

      console.log('  ✓ PASS (structure valid)');
      passCount++;
    } catch (error) {
      console.log(`  ✗ FAIL: ${error}`);
      failCount++;
    }
  }

  console.log('\nTest 12: Suggestion structure (recent_work)');
  try {
    const result = await generateSuggestions(TEST_USER_ID, {
      includeTypes: ['recent_work'],
    });

    const recentSuggestions = result.suggestions.filter(s => s.type === 'recent_work');
    if (recentSuggestions.length > 0) {
      const s = recentSuggestions[0];
      if (!s.title) throw new Error('title missing');
      if (!s.description.match(/ago|just now/)) throw new Error('description missing time');
      if (s.action !== 'Open') throw new Error('wrong action');
      if (!s.target_id) throw new Error('target_id missing');
      if (!s.metadata?.updated_at) throw new Error('updated_at missing');
    }

    console.log('  ✓ PASS (structure valid)');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 13: related_seed returns empty (not implemented)');
  try {
    const result = await generateSuggestions(TEST_USER_ID, {
      includeTypes: ['related_seed'],
    });

    const seedSuggestions = result.suggestions.filter(s => s.type === 'related_seed');
    if (seedSuggestions.length !== 0) {
      throw new Error('expected empty seed suggestions');
    }

    console.log('  ✓ PASS (empty as expected)');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 14: Metadata includes status');
  try {
    const result = await generateSuggestions(TEST_USER_ID, {
      includeTypes: ['recent_work'],
    });

    let hasStatus = false;
    for (const s of result.suggestions) {
      if (s.metadata?.status) {
        hasStatus = true;
        if (!['draft', 'active', 'saved', 'archived'].includes(s.metadata.status)) {
          throw new Error(`invalid status: ${s.metadata.status}`);
        }
      }
    }

    if (!hasStatus) {
      throw new Error('no status metadata found');
    }

    console.log('  ✓ PASS (status metadata valid)');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 15: Metadata includes tags');
  try {
    const result = await generateSuggestions(TEST_USER_ID, {
      includeTypes: ['recent_work'],
    });

    const withTags = result.suggestions.filter(s => s.metadata?.tags);
    if (withTags.length === 0) {
      throw new Error('no tags metadata found');
    }

    console.log(`  ✓ PASS (${withTags.length} with tags)`);
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  await cleanupTestData();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Total: ${passCount + failCount} | Pass: ${passCount} | Fail: ${failCount}`);
  console.log('='.repeat(50));

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
