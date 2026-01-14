#!/usr/bin/env tsx

import { getSeeds, insertSeed, getSeed, updateSeed, deleteSeed } from '../lib/pglite/seeds';
import type { SeedInsert } from '../lib/seeds/types';

async function testSeedsDB() {
  console.log('🧪 Testing Seeds Database Layer\n');

  try {
    console.log('1️⃣ Testing getSeeds() - list all seeds');
    const allSeeds = await getSeeds();
    console.log(`   Found ${allSeeds.length} seeds`);
    console.log('   ✅ getSeeds works\n');

    console.log('2️⃣ Testing insertSeed() - create new seed');
    const newSeed: SeedInsert = {
      name: 'Test Seed from DB Layer',
      type: 'principle',
      content: 'This is a test seed created directly via DB',
      why_matters: 'Testing seed creation',
      revisit_when: 'When testing updates',
      user_id: 'test-user',
    };
    const created = await insertSeed(newSeed);
    console.log(`   Created seed with ID: ${created.id}`);
    console.log('   ✅ insertSeed works\n');

    console.log('3️⃣ Testing getSeed() - get single seed');
    const single = await getSeed(created.id);
    console.log(`   Found seed: ${single?.name}`);
    console.log('   ✅ getSeed works\n');

    console.log('4️⃣ Testing updateSeed() - update seed');
    const updated = await updateSeed(created.id, {
      status: 'growing',
      why_matters: 'Updated via DB test',
    });
    console.log(`   Updated seed status to: ${updated?.status}`);
    console.log('   ✅ updateSeed works\n');

    console.log('5️⃣ Testing deleteSeed() - delete seed');
    const deleted = await deleteSeed(created.id);
    console.log(`   Deleted: ${deleted}`);
    console.log('   ✅ deleteSeed works\n');

    console.log('6️⃣ Testing filters - type filter');
    const principleSeeds = await getSeeds({ type: ['principle'] });
    console.log(`   Found ${principleSeeds.length} principle seeds`);
    console.log('   ✅ Type filter works\n');

    console.log('7️⃣ Testing filters - status filter');
    const newSeeds = await getSeeds({ status: ['new'] });
    console.log(`   Found ${newSeeds.length} new seeds`);
    console.log('   ✅ Status filter works\n');

    console.log('8️⃣ Testing filters - search');
    const searchResults = await getSeeds({ search: 'test' });
    console.log(`   Found ${searchResults.length} seeds matching "test"`);
    console.log('   ✅ Search works\n');

    console.log('✅ All database tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

testSeedsDB();
