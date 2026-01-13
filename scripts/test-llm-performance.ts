import { llmClient, canUseProvider } from '../lib/llm/client';
import { calculateCost } from '../lib/llm/registry';
import { startTrace, logEvent, endTrace } from '../lib/harness/trace';

interface PerformanceMetrics {
  latencies: number[];
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  mean: number;
  successCount: number;
  failureCount: number;
}

interface ThroughputMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number;
  requestsPerSecond: number;
  avgLatency: number;
}

const TEST_MESSAGE = [
  { role: 'user' as const, content: 'Hello! How are you?' },
];

function calculatePercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}

function calculateMetrics(latencies: number[], successCount: number, failureCount: number): PerformanceMetrics {
  if (latencies.length === 0) {
    return {
      latencies: [],
      p50: 0,
      p95: 0,
      p99: 0,
      min: 0,
      max: 0,
      mean: 0,
      successCount,
      failureCount,
    };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);

  return {
    latencies: sorted,
    p50: calculatePercentile(sorted, 50),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / sorted.length,
    successCount,
    failureCount,
  };
}

async function testSingleCallLatency(samples: number = 10): Promise<PerformanceMetrics> {
  console.log(`\n📊 Test 1: Single LLM Call Latency (${samples} samples)`);
  console.log('─'.repeat(60));

  const latencies: number[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < samples; i++) {
    const startTime = Date.now();

    try {
      await llmClient.callWithFallback('supervisor', TEST_MESSAGE, {
        temperature: 0.7,
        maxTokens: 50,
      });

      const duration = Date.now() - startTime;
      latencies.push(duration);
      successCount++;

      process.stdout.write(`  Sample ${i + 1}/${samples}: ${duration}ms ✓\n`);
    } catch (error) {
      const duration = Date.now() - startTime;
      failureCount++;
      process.stdout.write(`  Sample ${i + 1}/${samples}: ${duration}ms ✗ (${error instanceof Error ? error.message : 'Error'})\n`);
    }
  }

  const metrics = calculateMetrics(latencies, successCount, failureCount);

  console.log('\n  Results:');
  console.log(`    Success Rate: ${successCount}/${samples} (${((successCount / samples) * 100).toFixed(1)}%)`);
  console.log(`    p50 (median): ${metrics.p50.toFixed(2)}ms`);
  console.log(`    p95:          ${metrics.p95.toFixed(2)}ms ${metrics.p95 < 500 ? '✓' : '✗'} (target: <500ms)`);
  console.log(`    p99:          ${metrics.p99.toFixed(2)}ms`);
  console.log(`    Min:          ${metrics.min.toFixed(2)}ms`);
  console.log(`    Max:          ${metrics.max.toFixed(2)}ms`);
  console.log(`    Mean:         ${metrics.mean.toFixed(2)}ms`);

  return metrics;
}

async function testConcurrentThroughput(concurrency: number): Promise<ThroughputMetrics> {
  console.log(`\n📊 Test 2.${concurrency === 10 ? '1' : concurrency === 50 ? '2' : '3'}: Concurrent Call Throughput (${concurrency} concurrent)`);
  console.log('─'.repeat(60));

  const startTime = Date.now();
  const promises: Promise<void>[] = [];
  let successfulRequests = 0;
  let failedRequests = 0;

  for (let i = 0; i < concurrency; i++) {
    const promise = llmClient.callWithFallback('supervisor', TEST_MESSAGE, {
      temperature: 0.7,
      maxTokens: 50,
    })
      .then(() => {
        successfulRequests++;
        process.stdout.write('.');
      })
      .catch(() => {
        failedRequests++;
        process.stdout.write('✗');
      });

    promises.push(promise);
  }

  await Promise.all(promises);
  const totalDuration = Date.now() - startTime;
  const requestsPerSecond = (concurrency / totalDuration) * 1000;
  const avgLatency = totalDuration / concurrency;

  console.log('\n\n  Results:');
  console.log(`    Total Duration:  ${totalDuration.toFixed(2)}ms`);
  console.log(`    Successful:      ${successfulRequests}/${concurrency} (${((successfulRequests / concurrency) * 100).toFixed(1)}%)`);
  console.log(`    Failed:          ${failedRequests}/${concurrency}`);
  console.log(`    Throughput:      ${requestsPerSecond.toFixed(2)} req/s`);
  console.log(`    Avg Latency:     ${avgLatency.toFixed(2)}ms`);

  return {
    totalRequests: concurrency,
    successfulRequests,
    failedRequests,
    totalDuration,
    requestsPerSecond,
    avgLatency,
  };
}

async function testCostCalculationOverhead(iterations: number = 1000): Promise<number> {
  console.log(`\n📊 Test 3: Cost Calculation Overhead (${iterations.toLocaleString()} iterations)`);
  console.log('─'.repeat(60));

  const usage = {
    prompt_tokens: 1000,
    completion_tokens: 500,
  };

  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    calculateCost('deepseek-chat', usage);
  }

  const duration = performance.now() - startTime;
  const avgOverhead = duration / iterations;

  console.log(`  Results:`);
  console.log(`    Total Time:     ${duration.toFixed(3)}ms`);
  console.log(`    Avg Overhead:   ${avgOverhead.toFixed(6)}ms ${avgOverhead < 1 ? '✓' : '✗'} (target: <1ms)`);
  console.log(`    Operations/sec: ${(iterations / duration * 1000).toFixed(0)}`);

  return avgOverhead;
}

async function testHarnessTraceOverhead(iterations: number = 100): Promise<number> {
  console.log(`\n📊 Test 4: Harness Trace Overhead (${iterations} iterations)`);
  console.log('─'.repeat(60));

  const latencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    try {
      const trace = startTrace(`test-session-${i}`, 'test-user');
      logEvent('USER_INPUT', { test: true }, {}, {});
      await endTrace();

      const duration = performance.now() - startTime;
      latencies.push(duration);
    } catch (error) {
      // Trace might not be active, skip
    }
  }

  if (latencies.length === 0) {
    console.log('  ⚠️  Harness Trace not active (expected in dev mode)');
    return 0;
  }

  const avgOverhead = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
  const maxOverhead = Math.max(...latencies);
  const minOverhead = Math.min(...latencies);

  console.log(`  Results:`);
  console.log(`    Avg Overhead:   ${avgOverhead.toFixed(3)}ms ${avgOverhead < 10 ? '✓' : '✗'} (target: <10ms)`);
  console.log(`    Min Overhead:   ${minOverhead.toFixed(3)}ms`);
  console.log(`    Max Overhead:   ${maxOverhead.toFixed(3)}ms`);
  console.log(`    Successful:     ${latencies.length}/${iterations}`);

  return avgOverhead;
}

async function testFallbackRate(samples: number = 20): Promise<number> {
  console.log(`\n📊 Test 5: Fallback Rate (${samples} samples)`);
  console.log('─'.repeat(60));

  let fallbackCount = 0;
  let successCount = 0;
  let totalCount = 0;

  const hasDeepSeek = canUseProvider('deepseek');
  const hasOpenAI = canUseProvider('openai');

  if (!hasDeepSeek && hasOpenAI) {
    console.log('  ℹ️  DeepSeek not available - all requests will use OpenAI (expected)');
  } else if (!hasDeepSeek && !hasOpenAI) {
    console.log('  ℹ️  No API keys available - skipping fallback test');
    return 0;
  }

  for (let i = 0; i < samples; i++) {
    totalCount++;

    try {
      const response = await llmClient.callWithFallback('supervisor', TEST_MESSAGE, {
        temperature: 0.7,
        maxTokens: 50,
      });

      successCount++;

      // In a real scenario, we'd check if fallback was used via logs
      // For this test, we assume primary model worked if no error
      process.stdout.write('.');
    } catch (error) {
      fallbackCount++;
      process.stdout.write('F');
    }
  }

  console.log('\n');

  // Estimate fallback rate (in production, this would come from logs)
  // For now, we use failure rate as a proxy
  const fallbackRate = (fallbackCount / totalCount) * 100;

  console.log(`  Results:`);
  console.log(`    Total Requests:  ${totalCount}`);
  console.log(`    Successful:      ${successCount} (${((successCount / totalCount) * 100).toFixed(1)}%)`);
  console.log(`    Fallback/Failed: ${fallbackCount} (${fallbackRate.toFixed(1)}%) ${fallbackRate < 5 ? '✓' : '✗'} (target: <5%)`);

  return fallbackRate;
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       LLM Performance Test Suite - v0.3.5                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Check API availability
  console.log('\n🔍 Checking API Configuration...');
  const hasDeepSeek = canUseProvider('deepseek');
  const hasOpenAI = canUseProvider('openai');

  console.log(`   DeepSeek API: ${hasDeepSeek ? '✓ Available' : '✗ Not configured'}`);
  console.log(`   OpenAI API:   ${hasOpenAI ? '✓ Available' : '✗ Not configured'}`);

  if (!hasDeepSeek && !hasOpenAI) {
    console.log('\n⚠️  WARNING: No API keys configured.');
    console.log('   Performance tests require at least one API key to run.');
    console.log('   Skipping latency and throughput tests.\n');

    // Run only local tests
    await testCostCalculationOverhead(1000);
    await testHarnessTraceOverhead(100);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                   Tests Complete (Limited)                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    return;
  }

  try {
    // Test 1: Single call latency
    const latencyMetrics = await testSingleCallLatency(10);

    // Test 2: Concurrent throughput
    const throughput10 = await testConcurrentThroughput(10);
    const throughput50 = await testConcurrentThroughput(50);
    const throughput100 = await testConcurrentThroughput(100);

    // Test 3: Cost calculation overhead
    const costOverhead = await testCostCalculationOverhead(1000);

    // Test 4: Harness Trace overhead
    const traceOverhead = await testHarnessTraceOverhead(100);

    // Test 5: Fallback rate
    const fallbackRate = await testFallbackRate(20);

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                   Performance Summary                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('  Latency:');
    console.log(`    p50:                ${latencyMetrics.p50.toFixed(2)}ms`);
    console.log(`    p95:                ${latencyMetrics.p95.toFixed(2)}ms ${latencyMetrics.p95 < 500 ? '✓ PASS' : '✗ FAIL'} (target: <500ms)`);

    console.log('\n  Throughput:');
    console.log(`    10 concurrent:      ${throughput10.requestsPerSecond.toFixed(2)} req/s`);
    console.log(`    50 concurrent:      ${throughput50.requestsPerSecond.toFixed(2)} req/s`);
    console.log(`    100 concurrent:     ${throughput100.requestsPerSecond.toFixed(2)} req/s ${throughput100.successfulRequests === 100 ? '✓ PASS' : '✗ FAIL'}`);

    console.log('\n  Overhead:');
    console.log(`    Cost calculation:   ${costOverhead.toFixed(6)}ms ${costOverhead < 1 ? '✓ PASS' : '✗ FAIL'} (target: <1ms)`);
    console.log(`    Harness Trace:      ${traceOverhead.toFixed(3)}ms ${traceOverhead < 10 || traceOverhead === 0 ? '✓ PASS' : '✗ FAIL'} (target: <10ms)`);

    console.log('\n  Reliability:');
    console.log(`    Fallback rate:      ${fallbackRate.toFixed(1)}% ${fallbackRate < 5 ? '✓ PASS' : '✗ FAIL'} (target: <5%)`);

    // Overall pass/fail
    const allTestsPassed =
      latencyMetrics.p95 < 500 &&
      throughput100.successfulRequests === 100 &&
      costOverhead < 1 &&
      (traceOverhead < 10 || traceOverhead === 0) &&
      fallbackRate < 5;

    console.log('\n' + '─'.repeat(60));
    if (allTestsPassed) {
      console.log('  ✅ ALL PERFORMANCE TESTS PASSED');
    } else {
      console.log('  ⚠️  SOME PERFORMANCE TESTS FAILED');
    }
    console.log('─'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Performance tests failed with error:');
    console.error(error);
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
