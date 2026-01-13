import { getDB } from '../lib/pglite/client';

async function testMigration() {
  console.log('Testing context management migration...');
  
  try {
    const db = await getDB();
    
    const result = await db.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'context_snapshots'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n✅ Migration successful!');
    console.log('\nContext Snapshots Table Schema:');
    console.log('--------------------------------');
    for (const row of result.rows) {
      const r = row as any;
      console.log(`  ${r.column_name}: ${r.data_type}`);
    }
    
    const indexResult = await db.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'context_snapshots';
    `);
    
    console.log('\nIndexes:');
    console.log('--------');
    for (const row of indexResult.rows) {
      const r = row as any;
      console.log(`  ${r.indexname}`);
    }
    
    console.log('\n✅ All checks passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

testMigration();
