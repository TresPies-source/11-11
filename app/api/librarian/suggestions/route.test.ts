/**
 * Integration tests for suggestions API endpoint.
 */

import { GET } from './route';
import { NextRequest } from 'next/server';
import { getDB } from '@/lib/pglite/client';
import { embedPrompt } from '@/lib/librarian/embeddings';
import type { PromptInsert } from '@/lib/pglite/types';

const TEST_USER_ID = 'dev-user';
const BASE_URL = 'http://localhost:3000/api/librarian/suggestions';
let testPromptIds: { prompt1: string; prompt2: string; prompt3: string } = {
  prompt1: '',
  prompt2: '',
  prompt3: '',
};

async function setupTestData() {
  console.log('Setting up API test data...');
  process.env.NEXT_PUBLIC_DEV_MODE = 'true';

  const db = await getDB();
  await db.query('DELETE FROM prompts WHERE user_id = $1', [TEST_USER_ID]);

  const testPrompts = [
    {
      title: 'Test Prompt 1',
      content: 'This is a test prompt for suggestions API.',
      status: 'active',
      key: 'prompt1' as const,
    },
    {
      title: 'Test Prompt 2',
      content: 'Another test prompt with similar content.',
      status: 'active',
      key: 'prompt2' as const,
    },
    {
      title: 'Test Prompt 3',
      content: 'A third test prompt for variety.',
      status: 'draft',
      key: 'prompt3' as const,
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
      `INSERT INTO prompt_metadata (prompt_id, tags)
       VALUES ($1, $2)`,
      [promptId, ['test']]
    );
  }

  await db.query(
    `UPDATE prompts SET updated_at = NOW() - INTERVAL '1 hour' WHERE user_id = $1`,
    [TEST_USER_ID]
  );

  console.log('Generating embeddings...');
  for (const prompt of testPrompts) {
    try {
      await embedPrompt(testPromptIds[prompt.key], prompt.content, TEST_USER_ID);
    } catch (error) {
      console.warn(`Skipping embedding for ${prompt.title} (OpenAI may not be available)`);
    }
  }

  console.log('✓ API test data ready\n');
}

async function cleanupTestData() {
  const db = await getDB();
  await db.query('DELETE FROM prompts WHERE user_id = $1', [TEST_USER_ID]);
}

async function runTests() {
  console.log('Running suggestions API tests...\n');

  let passCount = 0;
  let failCount = 0;

  await setupTestData();

  console.log('Test 1: Return suggestions without parameters');
  try {
    const request = new NextRequest(`${BASE_URL}`);
    const response = await GET(request);

    if (response.status !== 200) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.suggestions) throw new Error('suggestions missing');
    if (!Array.isArray(data.suggestions)) throw new Error('suggestions not array');
    if (!data.context) throw new Error('context missing');
    if (data.context.user_id !== 'dev-user') throw new Error('wrong user_id');
    if (data.context.trigger !== 'manual') throw new Error('wrong trigger');
    if (!data.generated_at) throw new Error('generated_at missing');

    console.log(`  ✓ PASS (${data.suggestions.length} suggestions)`);
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 2: Return suggestions with prompt_id');
  try {
    const request = new NextRequest(`${BASE_URL}?prompt_id=${testPromptIds.prompt1}`);
    const response = await GET(request);

    if (response.status !== 200) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();
    if (data.context.prompt_id !== testPromptIds.prompt1) {
      throw new Error('wrong prompt_id');
    }

    console.log('  ✓ PASS');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 3: Respect limit parameter');
  try {
    const request = new NextRequest(`${BASE_URL}?limit=3`);
    const response = await GET(request);

    if (response.status !== 200) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();
    if (data.suggestions.length > 3) {
      throw new Error(`too many suggestions: ${data.suggestions.length}`);
    }

    console.log(`  ✓ PASS (${data.suggestions.length} <= 3)`);
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 4: Accept trigger parameter');
  try {
    const request = new NextRequest(`${BASE_URL}?trigger=page_load`);
    const response = await GET(request);

    if (response.status !== 200) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();
    if (data.context.trigger !== 'page_load') {
      throw new Error('wrong trigger');
    }

    console.log('  ✓ PASS');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 5: Filter by include_types');
  try {
    const request = new NextRequest(`${BASE_URL}?include_types=recent_work`);
    const response = await GET(request);

    if (response.status !== 200) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();
    for (const s of data.suggestions) {
      if (s.type !== 'recent_work') {
        throw new Error(`wrong type: ${s.type}`);
      }
    }

    console.log('  ✓ PASS (all recent_work)');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 6: Accept multiple include_types');
  try {
    const request = new NextRequest(`${BASE_URL}?include_types=similar_prompt,recent_work`);
    const response = await GET(request);

    if (response.status !== 200) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();
    const types = new Set(data.suggestions.map((s: any) => s.type));
    if (types.size === 0) {
      throw new Error('no suggestions');
    }

    console.log('  ✓ PASS');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 7: Validate limit parameter');
  try {
    const request = new NextRequest(`${BASE_URL}?limit=999`);
    const response = await GET(request);

    if (response.status !== 400) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error !== 'Invalid request parameters') {
      throw new Error('wrong error message');
    }

    console.log('  ✓ PASS');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 8: Validate trigger parameter');
  try {
    const request = new NextRequest(`${BASE_URL}?trigger=invalid_trigger`);
    const response = await GET(request);

    if (response.status !== 400) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error !== 'Invalid request parameters') {
      throw new Error('wrong error message');
    }

    console.log('  ✓ PASS');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 9: Handle negative limit');
  try {
    const request = new NextRequest(`${BASE_URL}?limit=-5`);
    const response = await GET(request);

    if (response.status !== 400) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error !== 'Invalid request parameters') {
      throw new Error('wrong error message');
    }

    console.log('  ✓ PASS');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 10: Return proper suggestion structure');
  try {
    const request = new NextRequest(`${BASE_URL}?limit=5`);
    const response = await GET(request);

    if (response.status !== 200) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();

    if (data.suggestions.length > 0) {
      const suggestion = data.suggestions[0];
      if (!suggestion.type) throw new Error('type missing');
      if (!['similar_prompt', 'related_seed', 'recent_work'].includes(suggestion.type)) {
        throw new Error('invalid type');
      }
      if (!suggestion.title) throw new Error('title missing');
      if (!suggestion.description) throw new Error('description missing');
      if (!suggestion.action) throw new Error('action missing');
      if (!suggestion.target_id) throw new Error('target_id missing');
    }

    console.log('  ✓ PASS');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 11: Handle complex query parameters');
  try {
    const request = new NextRequest(
      `${BASE_URL}?prompt_id=${testPromptIds.prompt1}&trigger=prompt_save&limit=5&include_types=similar_prompt,recent_work`
    );
    const response = await GET(request);

    if (response.status !== 200) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();
    if (data.context.prompt_id !== testPromptIds.prompt1) throw new Error('wrong prompt_id');
    if (data.context.trigger !== 'prompt_save') throw new Error('wrong trigger');
    if (data.suggestions.length > 5) throw new Error('limit not respected');

    console.log('  ✓ PASS');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 12: Handle empty results gracefully');
  try {
    const request = new NextRequest(`${BASE_URL}?include_types=related_seed`);
    const response = await GET(request);

    if (response.status !== 200) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.suggestions) throw new Error('suggestions missing');
    if (!Array.isArray(data.suggestions)) throw new Error('suggestions not array');

    console.log('  ✓ PASS');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 13: Handle missing prompt_id gracefully');
  try {
    const request = new NextRequest(`${BASE_URL}?prompt_id=nonexistent-prompt`);
    const response = await GET(request);

    if (response.status !== 200) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.suggestions) throw new Error('suggestions missing');

    console.log('  ✓ PASS');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 14: Return consistent response format');
  try {
    const request = new NextRequest(`${BASE_URL}`);
    const response = await GET(request);

    if (response.status !== 200) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.hasOwnProperty('suggestions')) throw new Error('suggestions missing');
    if (!data.hasOwnProperty('context')) throw new Error('context missing');
    if (!data.hasOwnProperty('generated_at')) throw new Error('generated_at missing');
    if (!data.context.hasOwnProperty('user_id')) throw new Error('user_id missing');
    if (!data.context.hasOwnProperty('trigger')) throw new Error('trigger missing');

    console.log('  ✓ PASS');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 15: Handle invalid limit gracefully');
  try {
    const request = new NextRequest(`${BASE_URL}?limit=abc`);
    const response = await GET(request);

    if (response.status !== 400) {
      throw new Error(`wrong status: ${response.status}`);
    }

    console.log('  ✓ PASS');
    passCount++;
  } catch (error) {
    console.log(`  ✗ FAIL: ${error}`);
    failCount++;
  }

  console.log('\nTest 16: Return proper error format');
  try {
    const request = new NextRequest(`${BASE_URL}?limit=999`);
    const response = await GET(request);

    if (response.status !== 400) {
      throw new Error(`wrong status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.error) throw new Error('error field missing');
    if (!data.details) throw new Error('details field missing');

    console.log('  ✓ PASS');
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
