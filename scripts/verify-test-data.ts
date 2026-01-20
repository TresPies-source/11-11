import { getDB } from '../lib/pglite/client';

async function verifyTestData() {
  console.log('Verifying AI Gateway test data...\n');
  
  const db = await getDB();
  
  const result = await db.query(`
    SELECT 
      COUNT(*) as total_count,
      SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as success_count,
      SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count,
      COUNT(DISTINCT provider_id) as provider_count
    FROM ai_gateway_logs
  `);
  
  const stats = result.rows[0] as any;
  
  console.log('Database Statistics:');
  console.log(`- Total log entries: ${stats.total_count}`);
  console.log(`- Successful requests: ${stats.success_count}`);
  console.log(`- Failed requests: ${stats.error_count}`);
  console.log(`- Unique providers: ${stats.provider_count}`);
  
  const providerResult = await db.query(`
    SELECT 
      provider_id,
      COUNT(*) as count,
      AVG(latency_ms) as avg_latency
    FROM ai_gateway_logs
    GROUP BY provider_id
    ORDER BY count DESC
  `);
  
  console.log('\nBy Provider:');
  for (const row of providerResult.rows) {
    const r = row as any;
    console.log(`- ${r.provider_id}: ${r.count} requests, ${parseFloat(r.avg_latency || '0').toFixed(0)}ms avg latency`);
  }
  
  console.log('\n✅ Verification complete!');
  process.exit(0);
}

verifyTestData().catch((error) => {
  console.error('Error verifying test data:', error);
  process.exit(1);
});
