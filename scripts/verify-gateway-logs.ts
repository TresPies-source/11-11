import { getDB } from '@/lib/pglite/client';

interface DBProvider {
  id: string;
  name: string;
  api_base_url: string;
  is_active: boolean;
  created_at: string;
}

interface DBGatewayLog {
  id: string;
  request_id: string;
  user_id: string | null;
  session_id: string | null;
  task_type: string | null;
  provider_id: string;
  model_id: string;
  request_payload: any;
  response_payload: any;
  latency_ms: number;
  cost_usd: string | null;
  status_code: number;
  error_message: string | null;
  created_at: string;
}

interface DBIndex {
  indexname: string;
  tablename: string;
}

async function verifyGatewayLogs() {
  console.log('Verifying AI Gateway Logs...\n');

  try {
    const db = await getDB();

    const providersResult = await db.query('SELECT * FROM ai_providers ORDER BY id');
    console.log('✓ AI Providers:');
    for (const provider of providersResult.rows) {
      const p = provider as DBProvider;
      console.log(`  - ${p.id}: ${p.name} (${p.api_base_url})`);
    }
    console.log();

    const logsResult = await db.query(
      'SELECT * FROM ai_gateway_logs ORDER BY created_at DESC LIMIT 10'
    );
    console.log(`✓ Gateway Logs (${logsResult.rows.length} records):`);
    for (const log of logsResult.rows) {
      const l = log as DBGatewayLog;
      console.log(`  Request: ${l.request_id}`);
      console.log(`    Provider: ${l.provider_id}/${l.model_id}`);
      console.log(`    Task Type: ${l.task_type || 'default'}`);
      console.log(`    Latency: ${l.latency_ms}ms`);
      console.log(`    Status: ${l.status_code}`);
      console.log(`    Cost: $${l.cost_usd || '0'}`);
      if (l.error_message) {
        console.log(`    Error: ${l.error_message}`);
      }
      console.log();
    }

    const indexesResult = await db.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename = 'ai_gateway_logs'
      ORDER BY indexname
    `);
    console.log('✓ Indexes:');
    for (const index of indexesResult.rows) {
      const i = index as DBIndex;
      console.log(`  - ${i.indexname}`);
    }
    console.log();

    console.log('✅ Gateway logs verification complete!');
  } catch (error: any) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      console.error('❌ Database tables not initialized.');
      console.error('   Hint: Start the dev server to initialize the database.');
      console.error('   Run: npm run dev');
    } else if (error.message?.includes('database') && error.message?.includes('not initialized')) {
      console.error('❌ Database not initialized.');
      console.error('   Hint: Run migration first or start the dev server.');
    } else {
      console.error('❌ Verification failed:', error.message || error);
    }
    process.exit(1);
  }
}

verifyGatewayLogs().catch(console.error);
