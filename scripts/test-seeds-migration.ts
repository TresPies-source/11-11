import { PGlite } from '@electric-sql/pglite';
import { applyMigration010 } from '../lib/pglite/migrations/010_add_seeds';

async function testMigration() {
  console.log('🧪 Testing Seeds Migration 010...\n');
  
  try {
    const db = new PGlite('memory://');
    
    console.log('✅ Created in-memory database');
    
    await applyMigration010(db);
    
    console.log('✅ Applied migration 010');
    
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'seeds'
      ) as exists;
    `);
    
    if ((tableCheck.rows[0] as any).exists) {
      console.log('✅ Seeds table created successfully');
    } else {
      console.error('❌ Seeds table NOT found');
      process.exit(1);
    }
    
    const columnsCheck = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'seeds'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Seeds table columns:');
    columnsCheck.rows.forEach((row: any) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    const indexesCheck = await db.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'seeds';
    `);
    
    console.log('\n🔍 Indexes:');
    indexesCheck.rows.forEach((row: any) => {
      console.log(`  - ${row.indexname}`);
    });
    
    const testSeed = {
      name: 'Test Seed',
      type: 'principle',
      status: 'new',
      content: 'This is a test seed content',
      why_matters: 'Testing database operations',
      revisit_when: 'After implementation'
    };
    
    console.log('\n🌱 Inserting test seed...');
    const insertResult = await db.query(`
      INSERT INTO seeds (name, type, status, content, why_matters, revisit_when)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, type, status, created_at;
    `, [
      testSeed.name,
      testSeed.type,
      testSeed.status,
      testSeed.content,
      testSeed.why_matters,
      testSeed.revisit_when
    ]);
    
    console.log('✅ Test seed inserted:', insertResult.rows[0] as any);
    
    console.log('\n📊 Fetching all seeds...');
    const selectResult = await db.query('SELECT * FROM seeds;');
    console.log(`✅ Found ${selectResult.rows.length} seed(s)`);
    
    console.log('\n🔄 Testing update with timestamp trigger...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await db.query(`
      UPDATE seeds 
      SET status = 'growing' 
      WHERE id = $1;
    `, [(insertResult.rows[0] as any).id]);
    
    const updatedSeed = await db.query(`
      SELECT created_at, updated_at, status 
      FROM seeds 
      WHERE id = $1;
    `, [(insertResult.rows[0] as any).id]);
    
    const created = new Date((updatedSeed.rows[0] as any).created_at).getTime();
    const updated = new Date((updatedSeed.rows[0] as any).updated_at).getTime();
    
    if (updated > created) {
      console.log('✅ Timestamp trigger working correctly');
      console.log(`  created_at: ${(updatedSeed.rows[0] as any).created_at}`);
      console.log(`  updated_at: ${(updatedSeed.rows[0] as any).updated_at}`);
    } else {
      console.error('❌ Timestamp trigger NOT working');
      process.exit(1);
    }
    
    console.log('\n✅ All tests passed!');
    console.log('\n🎉 Migration 010 is working correctly\n');
    
    await db.close();
    
  } catch (error) {
    console.error('\n❌ Migration test failed:', error);
    process.exit(1);
  }
}

testMigration();
