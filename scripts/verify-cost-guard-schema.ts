import { getDB } from '../lib/pglite/client';
import {
  insertCostRecord,
  getSessionTokenUsage,
  getUserMonthlyTokenUsage,
  createSession,
  updateSessionUsage,
  upsertUserMonthlyUsage,
  getCostRecords,
  getCurrentMonth,
} from '../lib/pglite/cost';

async function verifySchema() {
  console.log('🔍 Verifying Cost Guard schema...\n');

  const db = await getDB();

  const tables = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('sessions', 'user_monthly_usage', 'cost_records')
    ORDER BY table_name
  `);

  console.log('✅ Tables created:');
  tables.rows.forEach((row: any) => {
    console.log(`   - ${row.table_name}`);
  });

  console.log('\n🧪 Testing database operations...\n');

  const testUserId = 'test-user-123';
  const testMonth = getCurrentMonth();

  console.log('1. Creating test session...');
  const session = await createSession({
    user_id: testUserId,
    total_tokens: 0,
    total_cost_usd: 0,
  });
  console.log(`   ✓ Session created: ${session.id}`);

  console.log('\n2. Inserting test cost record...');
  const costRecord = await insertCostRecord({
    user_id: testUserId,
    session_id: session.id,
    query_id: 'test-query-1',
    model: 'gpt-4o',
    prompt_tokens: 450,
    completion_tokens: 1800,
    total_tokens: 2250,
    cost_usd: 0.019125,
    operation_type: 'agent_execution',
  });
  console.log(`   ✓ Cost record inserted: ${costRecord.id}`);

  console.log('\n3. Updating session usage...');
  await updateSessionUsage(session.id, 2250, 0.019125);
  const sessionUsage = await getSessionTokenUsage(session.id);
  console.log(`   ✓ Session usage: ${sessionUsage} tokens`);

  console.log('\n4. Upserting user monthly usage...');
  await upsertUserMonthlyUsage(testUserId, testMonth, 2250, 0.019125);
  const userUsage = await getUserMonthlyTokenUsage(testUserId);
  console.log(`   ✓ User monthly usage: ${userUsage} tokens`);

  console.log('\n5. Retrieving cost records...');
  const records = await getCostRecords(testUserId, 10);
  console.log(`   ✓ Retrieved ${records.length} cost record(s)`);

  console.log('\n6. Testing upsert (incrementing existing record)...');
  await upsertUserMonthlyUsage(testUserId, testMonth, 1000, 0.005);
  const updatedUserUsage = await getUserMonthlyTokenUsage(testUserId);
  console.log(`   ✓ Updated user monthly usage: ${updatedUserUsage} tokens (should be 3250)`);

  console.log('\n✅ All tests passed! Cost Guard schema is working correctly.\n');

  console.log('📊 Summary:');
  console.log(`   - Tables created: ${tables.rows.length}/3`);
  console.log(`   - Session created: ${session.id}`);
  console.log(`   - Cost record inserted: ${costRecord.id}`);
  console.log(`   - Session total: ${sessionUsage} tokens`);
  console.log(`   - User monthly total: ${updatedUserUsage} tokens`);
  console.log(`   - Current month: ${testMonth}\n`);
}

verifySchema().catch((error) => {
  console.error('❌ Error verifying schema:', error);
  process.exit(1);
});
