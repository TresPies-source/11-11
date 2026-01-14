#!/usr/bin/env tsx

const API_BASE = 'http://localhost:3007/api/seeds';

async function testSeedsAPI() {
  console.log('🧪 Testing Seeds API\n');

  try {
    console.log('1️⃣ Testing GET /api/seeds (list all seeds)');
    const listResponse = await fetch(API_BASE);
    const listData = await listResponse.json();
    console.log(`   Status: ${listResponse.status}`);
    console.log(`   Response:`, JSON.stringify(listData, null, 2));
    console.log('   ✅ GET /api/seeds works\n');

    console.log('2️⃣ Testing POST /api/seeds (create new seed)');
    const createResponse = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Seed from API',
        type: 'principle',
        content: 'This is a test seed created via API',
        why_matters: 'Testing seed creation',
        revisit_when: 'When testing updates',
      }),
    });
    const createData = await createResponse.json();
    console.log(`   Status: ${createResponse.status}`);
    console.log(`   Response:`, JSON.stringify(createData, null, 2));
    
    if (createResponse.status === 201) {
      console.log('   ✅ POST /api/seeds works\n');
      
      const seedId = createData.id;
      
      console.log(`3️⃣ Testing GET /api/seeds/${seedId} (get single seed)`);
      const getResponse = await fetch(`${API_BASE}/${seedId}`);
      const getData = await getResponse.json();
      console.log(`   Status: ${getResponse.status}`);
      console.log(`   Response:`, JSON.stringify(getData, null, 2));
      console.log('   ✅ GET /api/seeds/[id] works\n');
      
      console.log(`4️⃣ Testing PATCH /api/seeds/${seedId} (update seed)`);
      const updateResponse = await fetch(`${API_BASE}/${seedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'growing',
          why_matters: 'Updated via API test',
        }),
      });
      const updateData = await updateResponse.json();
      console.log(`   Status: ${updateResponse.status}`);
      console.log(`   Response:`, JSON.stringify(updateData, null, 2));
      console.log('   ✅ PATCH /api/seeds/[id] works\n');
      
      console.log(`5️⃣ Testing DELETE /api/seeds/${seedId} (delete seed)`);
      const deleteResponse = await fetch(`${API_BASE}/${seedId}`, {
        method: 'DELETE',
      });
      const deleteData = await deleteResponse.json();
      console.log(`   Status: ${deleteResponse.status}`);
      console.log(`   Response:`, JSON.stringify(deleteData, null, 2));
      console.log('   ✅ DELETE /api/seeds/[id] works\n');
      
      console.log('6️⃣ Testing search filter');
      const searchResponse = await fetch(`${API_BASE}?search=test`);
      const searchData = await searchResponse.json();
      console.log(`   Status: ${searchResponse.status}`);
      console.log(`   Found ${searchData.count} seeds`);
      console.log('   ✅ Search filter works\n');
      
      console.log('7️⃣ Testing type filter');
      const typeResponse = await fetch(`${API_BASE}?type=principle`);
      const typeData = await typeResponse.json();
      console.log(`   Status: ${typeResponse.status}`);
      console.log(`   Found ${typeData.count} principle seeds`);
      console.log('   ✅ Type filter works\n');
      
      console.log('8️⃣ Testing status filter');
      const statusResponse = await fetch(`${API_BASE}?status=new,growing`);
      const statusData = await statusResponse.json();
      console.log(`   Status: ${statusResponse.status}`);
      console.log(`   Found ${statusData.count} new/growing seeds`);
      console.log('   ✅ Status filter works\n');
      
    } else {
      console.log('   ❌ POST /api/seeds failed\n');
    }

    console.log('✅ All API tests completed successfully!');
  } catch (error) {
    console.error('❌ API test failed:', error);
    process.exit(1);
  }
}

testSeedsAPI();
