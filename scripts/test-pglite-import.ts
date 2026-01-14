#!/usr/bin/env tsx

async function testPGliteImport() {
  console.log('Testing PGlite import...');
  
  try {
    console.log('1. Importing getDB...');
    const { getDB } = await import('../lib/pglite/client.js');
    console.log('✅ getDB imported successfully');
    
    console.log('2. Calling getDB()...');
    const db = await getDB();
    console.log('✅ getDB() called successfully');
    
    console.log('3. Testing query...');
    const result = await db.query('SELECT 1 as test');
    console.log('✅ Query successful:', result.rows);
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPGliteImport();
