import { getDB } from './client';

export async function generateGatewayTestData() {
  console.log('Generating test data for AI Gateway dashboard...\n');
  
  const db = await getDB();
  
  const testData = [
    { provider: 'deepseek', model: 'deepseek-chat', taskType: 'code_generation', statusCode: 200, latency: 1200, cost: 0.00049, error: null },
    { provider: 'deepseek', model: 'deepseek-chat', taskType: 'general_chat', statusCode: 200, latency: 850, cost: 0.00032, error: null },
    { provider: 'deepseek', model: 'deepseek-reasoner', taskType: 'complex_reasoning', statusCode: 200, latency: 3500, cost: 0.00125, error: null },
    { provider: 'openai', model: 'gpt-4o-mini', taskType: 'general_chat', statusCode: 200, latency: 950, cost: 0.00045, error: null },
    { provider: 'openai', model: 'gpt-4o-mini', taskType: 'content_synthesis', statusCode: 200, latency: 1100, cost: 0.00053, error: null },
    { provider: 'deepseek', model: 'deepseek-chat', taskType: 'code_generation', statusCode: 200, latency: 1300, cost: 0.00051, error: null },
    { provider: 'deepseek', model: 'deepseek-chat', taskType: 'architectural_design', statusCode: 200, latency: 1450, cost: 0.00067, error: null },
    { provider: 'openai', model: 'gpt-4o-mini', taskType: 'general_chat', statusCode: 429, latency: null, cost: null, error: 'Rate limit exceeded' },
    { provider: 'deepseek', model: 'deepseek-chat', taskType: 'code_generation', statusCode: 200, latency: 1150, cost: 0.00048, error: null },
    { provider: 'deepseek', model: 'deepseek-chat', taskType: 'general_chat', statusCode: 200, latency: 920, cost: 0.00034, error: null },
    { provider: 'openai', model: 'gpt-4o-mini', taskType: 'code_generation', statusCode: 200, latency: 1050, cost: 0.00047, error: null },
    { provider: 'deepseek', model: 'deepseek-reasoner', taskType: 'complex_reasoning', statusCode: 200, latency: 3200, cost: 0.00118, error: null },
    { provider: 'deepseek', model: 'deepseek-chat', taskType: 'content_synthesis', statusCode: 200, latency: 1250, cost: 0.00052, error: null },
    { provider: 'openai', model: 'gpt-4o-mini', taskType: 'general_chat', statusCode: 200, latency: 880, cost: 0.00041, error: null },
    { provider: 'deepseek', model: 'deepseek-chat', taskType: 'code_generation', statusCode: 200, latency: 1400, cost: 0.00055, error: null },
    { provider: 'deepseek', model: 'deepseek-chat', taskType: 'general_chat', statusCode: 500, latency: null, cost: null, error: 'Internal server error' },
    { provider: 'openai', model: 'gpt-4o-mini', taskType: 'architectural_design', statusCode: 200, latency: 1180, cost: 0.00049, error: null },
    { provider: 'deepseek', model: 'deepseek-chat', taskType: 'code_generation', statusCode: 200, latency: 1280, cost: 0.00050, error: null },
    { provider: 'deepseek', model: 'deepseek-chat', taskType: 'general_chat', statusCode: 200, latency: 910, cost: 0.00035, error: null },
    { provider: 'openai', model: 'gpt-4o-mini', taskType: 'content_synthesis', statusCode: 200, latency: 1020, cost: 0.00046, error: null },
  ];
  
  console.log(`Inserting ${testData.length} test log entries...\n`);
  
  for (const entry of testData) {
    const requestId = `test-req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const sessionId = `test-session-${Math.floor(Math.random() * 5) + 1}`;
    const userId = 'test-user-1';
    
    await db.query(
      `INSERT INTO ai_gateway_logs (
        request_id, user_id, session_id, task_type, provider_id, model_id,
        request_payload, response_payload, latency_ms, cost_usd, status_code, error_message, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW() - (INTERVAL '1 minute' * FLOOR(RANDOM() * 60)))`,
      [
        requestId,
        userId,
        sessionId,
        entry.taskType,
        entry.provider,
        entry.model,
        JSON.stringify({ messages: [{ role: 'user', content: 'test query' }] }),
        JSON.stringify({ content: 'test response', usage: { total_tokens: 100 } }),
        entry.latency,
        entry.cost,
        entry.statusCode,
        entry.error,
      ]
    );
  }
  
  console.log('\n✅ Test data generation complete!');
  console.log('\nSummary:');
  console.log(`- Total requests: ${testData.length}`);
  console.log(`- DeepSeek requests: ${testData.filter(e => e.provider === 'deepseek').length}`);
  console.log(`- OpenAI requests: ${testData.filter(e => e.provider === 'openai').length}`);
  console.log(`- Successful requests: ${testData.filter(e => e.statusCode === 200).length}`);
  console.log(`- Failed requests: ${testData.filter(e => e.statusCode !== 200).length}`);
  
  console.log('\nRefresh the page to see the updated dashboard!');
  
  return {
    success: true,
    count: testData.length
  };
}

if (typeof window !== 'undefined') {
  (window as any).generateGatewayTestData = generateGatewayTestData;
  console.log('Test data generator loaded. Run window.generateGatewayTestData() to generate test data.');
}
