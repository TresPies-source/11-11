import { getDB } from '@/lib/pglite/client';
import { getSeeds, getSeed, insertSeed, updateSeed, deleteSeed } from '@/lib/pglite/seeds';
import type { SeedInsert, SeedUpdate, SeedFilters, SeedRow } from '@/lib/seeds/types';

function generateMemoryPatch(seeds: SeedRow[]): string {
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });

  const header = `# Memory Patch: Replanted Seeds

_Generated on ${timestamp}_

---

`;

  const seedSections = seeds.map(seed => {
    return `## Seed: ${seed.name}

**Type:** ${seed.type}  
**Status:** ${seed.status}

**Why it matters:** ${seed.why_matters || 'N/A'}  
**Revisit when:** ${seed.revisit_when || 'N/A'}

**Content:**
${seed.content}

---
`;
  }).join('\n');

  const footer = `
**Total Seeds:** ${seeds.length}
`;

  return header + seedSections + footer;
}

async function testIntegration() {
  console.log('=== Testing Seeds Integration Workflows ===\n');

  try {
    await getDB();
    console.log('✓ Database connected\n');

    console.log('--- Workflow 1: Create → Fetch → Update → Delete ---\n');

    const seedData: SeedInsert = {
      name: 'Integration Test Seed',
      type: 'principle',
      status: 'new',
      content: 'This seed is created for integration testing purposes.',
      why_matters: 'Ensures full CRUD workflow works correctly',
      revisit_when: 'Before each release',
      user_id: 'test@integration.dev',
    };

    console.log('Step 1: Creating seed...');
    const createdSeed = await insertSeed(seedData);
    console.log(`✓ Created seed: ${createdSeed.name} (${createdSeed.id})`);
    
    if (!createdSeed.id || createdSeed.name !== seedData.name) {
      throw new Error('Created seed data does not match input');
    }

    console.log('\nStep 2: Fetching created seed...');
    const fetchedSeed = await getSeed(createdSeed.id);
    
    if (!fetchedSeed) {
      throw new Error('Failed to fetch created seed');
    }
    console.log(`✓ Fetched seed: ${fetchedSeed.name}`);
    
    if (fetchedSeed.id !== createdSeed.id) {
      throw new Error('Fetched seed ID does not match created seed');
    }

    console.log('\nStep 3: Updating seed status to "growing"...');
    const updateData: SeedUpdate = {
      status: 'growing',
      why_matters: 'Updated during integration test',
    };
    
    const updatedSeed = await updateSeed(createdSeed.id, updateData);
    
    if (!updatedSeed) {
      throw new Error('Failed to update seed');
    }
    console.log(`✓ Updated seed status: ${updatedSeed.status}`);
    
    if (updatedSeed.status !== 'growing') {
      throw new Error('Seed status was not updated correctly');
    }
    
    if (updatedSeed.why_matters !== updateData.why_matters) {
      throw new Error('Seed why_matters was not updated correctly');
    }

    console.log('\nStep 4: Deleting seed...');
    const deleteResult = await deleteSeed(createdSeed.id);
    
    if (!deleteResult) {
      throw new Error('Failed to delete seed');
    }
    console.log(`✓ Deleted seed: ${createdSeed.id}`);
    
    const deletedCheck = await getSeed(createdSeed.id);
    if (deletedCheck !== null) {
      throw new Error('Seed still exists after deletion');
    }
    console.log('✓ Confirmed seed no longer exists\n');

    console.log('--- Workflow 2: Filter Seeds by Type and Status ---\n');

    const testSeeds: SeedInsert[] = [
      {
        name: 'Principle Seed New',
        type: 'principle',
        status: 'new',
        content: 'Principle content for testing filters',
        user_id: 'test@integration.dev',
      },
      {
        name: 'Principle Seed Growing',
        type: 'principle',
        status: 'growing',
        content: 'Growing principle content',
        user_id: 'test@integration.dev',
      },
      {
        name: 'Pattern Seed Mature',
        type: 'pattern',
        status: 'mature',
        content: 'Mature pattern content',
        user_id: 'test@integration.dev',
      },
      {
        name: 'Question Seed New',
        type: 'question',
        status: 'new',
        content: 'Question content for testing',
        user_id: 'test@integration.dev',
      },
      {
        name: 'Route Seed Compost',
        type: 'route',
        status: 'compost',
        content: 'Composted route content',
        user_id: 'test@integration.dev',
      },
    ];

    console.log('Creating test seeds for filtering...');
    const createdTestSeeds: SeedRow[] = [];
    for (const seed of testSeeds) {
      const created = await insertSeed(seed);
      createdTestSeeds.push(created);
    }
    console.log(`✓ Created ${createdTestSeeds.length} test seeds\n`);

    console.log('Testing filter by single type (principle)...');
    const principleFilter: SeedFilters = { type: ['principle'] };
    const principleSeeds = await getSeeds(principleFilter);
    
    const principleFromTest = principleSeeds.filter(s => 
      createdTestSeeds.some(ts => ts.id === s.id)
    );
    
    if (principleFromTest.length !== 2) {
      throw new Error(`Expected 2 principle seeds, got ${principleFromTest.length}`);
    }
    
    if (principleFromTest.some(s => s.type !== 'principle')) {
      throw new Error('Filter returned non-principle seeds');
    }
    console.log(`✓ Found ${principleFromTest.length} principle seeds\n`);

    console.log('Testing filter by single status (new)...');
    const newStatusFilter: SeedFilters = { status: ['new'] };
    const newSeeds = await getSeeds(newStatusFilter);
    
    const newFromTest = newSeeds.filter(s => 
      createdTestSeeds.some(ts => ts.id === s.id)
    );
    
    if (newFromTest.length !== 2) {
      throw new Error(`Expected 2 new seeds, got ${newFromTest.length}`);
    }
    
    if (newFromTest.some(s => s.status !== 'new')) {
      throw new Error('Filter returned non-new seeds');
    }
    console.log(`✓ Found ${newFromTest.length} new seeds\n`);

    console.log('Testing filter by multiple types (pattern, question)...');
    const multiTypeFilter: SeedFilters = { type: ['pattern', 'question'] };
    const multiTypeSeeds = await getSeeds(multiTypeFilter);
    
    const multiTypeFromTest = multiTypeSeeds.filter(s => 
      createdTestSeeds.some(ts => ts.id === s.id)
    );
    
    if (multiTypeFromTest.length !== 2) {
      throw new Error(`Expected 2 seeds, got ${multiTypeFromTest.length}`);
    }
    
    const hasInvalidType = multiTypeFromTest.some(s => 
      !['pattern', 'question'].includes(s.type)
    );
    if (hasInvalidType) {
      throw new Error('Multi-type filter returned invalid types');
    }
    console.log(`✓ Found ${multiTypeFromTest.length} pattern/question seeds\n`);

    console.log('Testing combined filters (type + status)...');
    const combinedFilter: SeedFilters = { 
      type: ['principle'], 
      status: ['growing'] 
    };
    const combinedSeeds = await getSeeds(combinedFilter);
    
    const combinedFromTest = combinedSeeds.filter(s => 
      createdTestSeeds.some(ts => ts.id === s.id)
    );
    
    if (combinedFromTest.length !== 1) {
      throw new Error(`Expected 1 seed, got ${combinedFromTest.length}`);
    }
    
    if (combinedFromTest[0].type !== 'principle' || combinedFromTest[0].status !== 'growing') {
      throw new Error('Combined filter returned wrong seed');
    }
    console.log('✓ Combined filter works correctly\n');

    console.log('--- Workflow 3: Search Seeds by Name and Content ---\n');

    console.log('Testing search by name...');
    const nameSearchFilter: SeedFilters = { search: 'Pattern Seed' };
    const nameSearchResults = await getSeeds(nameSearchFilter);
    
    const nameSearchFromTest = nameSearchResults.filter(s => 
      createdTestSeeds.some(ts => ts.id === s.id)
    );
    
    if (nameSearchFromTest.length === 0) {
      throw new Error('Search by name returned no results');
    }
    
    const foundPatternSeed = nameSearchFromTest.some(s => s.name === 'Pattern Seed Mature');
    if (!foundPatternSeed) {
      throw new Error('Search did not find expected seed by name');
    }
    console.log(`✓ Search by name found ${nameSearchFromTest.length} seed(s)\n`);

    console.log('Testing search by content...');
    const contentSearchFilter: SeedFilters = { search: 'Growing principle content' };
    const contentSearchResults = await getSeeds(contentSearchFilter);
    
    const contentSearchFromTest = contentSearchResults.filter(s => 
      createdTestSeeds.some(ts => ts.id === s.id)
    );
    
    if (contentSearchFromTest.length === 0) {
      throw new Error('Search by content returned no results');
    }
    
    const foundByContent = contentSearchFromTest.some(s => 
      s.content.includes('Growing principle content')
    );
    if (!foundByContent) {
      throw new Error('Search did not find expected seed by content');
    }
    console.log(`✓ Search by content found ${contentSearchFromTest.length} seed(s)\n`);

    console.log('Testing case-insensitive search...');
    const caseInsensitiveFilter: SeedFilters = { search: 'QUESTION SEED' };
    const caseInsensitiveResults = await getSeeds(caseInsensitiveFilter);
    
    const caseInsensitiveFromTest = caseInsensitiveResults.filter(s => 
      createdTestSeeds.some(ts => ts.id === s.id)
    );
    
    if (caseInsensitiveFromTest.length === 0) {
      throw new Error('Case-insensitive search failed');
    }
    console.log('✓ Case-insensitive search works\n');

    console.log('Testing combined search and filter...');
    const combinedSearchFilter: SeedFilters = { 
      search: 'content',
      type: ['principle', 'pattern'] 
    };
    const combinedSearchResults = await getSeeds(combinedSearchFilter);
    
    const combinedSearchFromTest = combinedSearchResults.filter(s => 
      createdTestSeeds.some(ts => ts.id === s.id)
    );
    
    if (combinedSearchFromTest.length === 0) {
      throw new Error('Combined search and filter returned no results');
    }
    
    const hasWrongType = combinedSearchFromTest.some(s => 
      !['principle', 'pattern'].includes(s.type)
    );
    if (hasWrongType) {
      throw new Error('Combined filter returned wrong type');
    }
    console.log(`✓ Combined search and filter found ${combinedSearchFromTest.length} seed(s)\n`);

    console.log('--- Workflow 4: Export Memory Patch ---\n');

    const seedsToExport = createdTestSeeds.slice(0, 3);
    
    console.log(`Exporting Memory Patch for ${seedsToExport.length} seeds...`);
    const memoryPatch = generateMemoryPatch(seedsToExport);
    console.log(`✓ Memory Patch generated (${memoryPatch.length} bytes)\n`);

    if (!memoryPatch.includes('# Memory Patch: Replanted Seeds')) {
      throw new Error('Memory Patch missing header');
    }
    console.log('✓ Memory Patch has header');

    if (!memoryPatch.includes(`**Total Seeds:** ${seedsToExport.length}`)) {
      throw new Error('Memory Patch missing footer');
    }
    console.log('✓ Memory Patch has footer with correct count');

    for (const seed of seedsToExport) {
      if (!memoryPatch.includes(`## Seed: ${seed.name}`)) {
        throw new Error(`Memory Patch missing seed: ${seed.name}`);
      }
      if (!memoryPatch.includes(`**Type:** ${seed.type}`)) {
        throw new Error(`Memory Patch missing type for: ${seed.name}`);
      }
      if (!memoryPatch.includes(seed.content)) {
        throw new Error(`Memory Patch missing content for: ${seed.name}`);
      }
    }
    console.log('✓ All seeds present in Memory Patch');
    console.log('✓ All metadata included (type, status, content)\n');

    console.log('Memory Patch Preview (first 400 chars):');
    console.log('─'.repeat(60));
    console.log(memoryPatch.substring(0, 400) + '...\n');

    console.log('--- Workflow 5: Full Lifecycle (Create → Update → Replant → Export) ---\n');

    const lifecycleSeed: SeedInsert = {
      name: 'Lifecycle Test Seed',
      type: 'pattern',
      status: 'new',
      content: 'This seed goes through a full lifecycle',
      why_matters: 'Testing complete workflow',
      revisit_when: 'When implementing similar features',
      user_id: 'test@integration.dev',
    };

    console.log('Step 1: Create seed...');
    const lifecycleCreated = await insertSeed(lifecycleSeed);
    console.log(`✓ Created: ${lifecycleCreated.name} (status: ${lifecycleCreated.status})`);

    console.log('\nStep 2: Update to "growing"...');
    await updateSeed(lifecycleCreated.id, { status: 'growing' });
    const growing = await getSeed(lifecycleCreated.id);
    console.log(`✓ Updated status: ${growing?.status}`);

    console.log('\nStep 3: Update to "mature"...');
    await updateSeed(lifecycleCreated.id, { status: 'mature' });
    const mature = await getSeed(lifecycleCreated.id);
    console.log(`✓ Updated status: ${mature?.status}`);

    console.log('\nStep 4: Mark as replanted...');
    await updateSeed(lifecycleCreated.id, { 
      replanted: true, 
      replant_count: 1 
    });
    const replanted = await getSeed(lifecycleCreated.id);
    console.log(`✓ Replanted: ${replanted?.replanted} (count: ${replanted?.replant_count})`);

    console.log('\nStep 5: Export as Memory Patch...');
    const lifecyclePatch = generateMemoryPatch(replanted ? [replanted] : []);
    console.log(`✓ Exported Memory Patch (${lifecyclePatch.length} bytes)`);
    
    if (!lifecyclePatch.includes(lifecycleSeed.name)) {
      throw new Error('Lifecycle Memory Patch missing seed');
    }

    console.log('\nStep 6: Clean up...');
    await deleteSeed(lifecycleCreated.id);
    console.log(`✓ Deleted lifecycle seed\n`);

    console.log('--- Workflow 6: Filter by User and Session ---\n');

    const userSeeds: SeedInsert[] = [
      {
        name: 'User A Seed 1',
        type: 'principle',
        content: 'User A content',
        user_id: 'userA@test.dev',
        session_id: 'session_1',
      },
      {
        name: 'User A Seed 2',
        type: 'pattern',
        content: 'User A content 2',
        user_id: 'userA@test.dev',
        session_id: 'session_2',
      },
      {
        name: 'User B Seed 1',
        type: 'question',
        content: 'User B content',
        user_id: 'userB@test.dev',
        session_id: 'session_1',
      },
    ];

    console.log('Creating seeds for different users...');
    const userTestSeeds: SeedRow[] = [];
    for (const seed of userSeeds) {
      const created = await insertSeed(seed);
      userTestSeeds.push(created);
    }
    console.log(`✓ Created ${userTestSeeds.length} seeds\n`);

    console.log('Testing filter by user_id...');
    const userAFilter: SeedFilters = { user_id: 'userA@test.dev' };
    const userASeeds = await getSeeds(userAFilter);
    
    const userAFromTest = userASeeds.filter(s => 
      userTestSeeds.some(ts => ts.id === s.id)
    );
    
    if (userAFromTest.length !== 2) {
      throw new Error(`Expected 2 seeds for User A, got ${userAFromTest.length}`);
    }
    console.log(`✓ Found ${userAFromTest.length} seeds for User A\n`);

    console.log('Testing filter by session_id...');
    const session1Filter: SeedFilters = { session_id: 'session_1' };
    const session1Seeds = await getSeeds(session1Filter);
    
    const session1FromTest = session1Seeds.filter(s => 
      userTestSeeds.some(ts => ts.id === s.id)
    );
    
    if (session1FromTest.length !== 2) {
      throw new Error(`Expected 2 seeds for session_1, got ${session1FromTest.length}`);
    }
    console.log(`✓ Found ${session1FromTest.length} seeds for session_1\n`);

    console.log('Testing combined user + session filter...');
    const userSessionFilter: SeedFilters = { 
      user_id: 'userA@test.dev',
      session_id: 'session_1'
    };
    const userSessionSeeds = await getSeeds(userSessionFilter);
    
    const userSessionFromTest = userSessionSeeds.filter(s => 
      userTestSeeds.some(ts => ts.id === s.id)
    );
    
    if (userSessionFromTest.length !== 1) {
      throw new Error(`Expected 1 seed, got ${userSessionFromTest.length}`);
    }
    console.log('✓ Combined user + session filter works\n');

    console.log('Cleaning up all test seeds...');
    const allTestSeedIds = [
      ...createdTestSeeds.map(s => s.id),
      ...userTestSeeds.map(s => s.id),
    ];
    
    for (const seedId of allTestSeedIds) {
      await deleteSeed(seedId);
    }
    console.log(`✓ Deleted ${allTestSeedIds.length} test seeds\n`);

    console.log('=== All Integration Tests Passed! ===');
    console.log('\n✅ All workflows completed successfully:');
    console.log('  1. Create → Fetch → Update → Delete');
    console.log('  2. Filter by Type and Status');
    console.log('  3. Search by Name and Content');
    console.log('  4. Export Memory Patch');
    console.log('  5. Full Lifecycle (New → Growing → Mature → Replanted)');
    console.log('  6. Filter by User and Session');
    
    return true;
  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    throw error;
  }
}

testIntegration()
  .then(() => {
    console.log('\n✓ Seeds integration tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeds integration tests failed:', error);
    process.exit(1);
  });
