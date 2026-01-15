/**
 * Manual Test Script for Builder Agent
 * 
 * Tests the Builder agent's code generation capabilities:
 * - Basic code generation request
 * - Artifact validation
 * - Error handling
 * - Harness Trace integration
 */

import { handleBuilderQuery, type BuilderAgentQuery, BuilderAgentError } from './lib/agents/builder-handler';
import { startTrace, endTrace, getCurrentTrace } from './lib/harness/trace';
import type { HarnessEvent } from './lib/harness/types';

/**
 * Helper function to flatten nested events into a single array
 */
function flattenEvents(events: HarnessEvent[]): HarnessEvent[] {
  const result: HarnessEvent[] = [];
  
  for (const event of events) {
    result.push(event);
    if (event.nested_events && event.nested_events.length > 0) {
      result.push(...flattenEvents(event.nested_events));
    }
  }
  
  return result;
}

async function testBuilderAgent() {
  console.log('🛠️  Testing Builder Agent...\n');

  // Initialize trace for testing
  const trace = startTrace('test-session', 'test-user');
  console.log(`✓ Trace initialized: ${trace.trace_id}\n`);

  // Test 1: Basic code generation
  console.log('Test 1: Basic Code Generation');
  console.log('--------------------------------');
  
  try {
    const query: BuilderAgentQuery = {
      request: 'Create a simple React component called HelloWorld that displays a greeting message',
      context_file_paths: [], // No context files for this simple test
    };

    const response = await handleBuilderQuery(query);
    
    console.log('✓ Request completed successfully');
    console.log(`  Summary: ${response.summary}`);
    console.log(`  Artifacts generated: ${response.artifacts.length}`);
    
    for (const artifact of response.artifacts) {
      console.log(`\n  Artifact: ${artifact.path}`);
      console.log(`  Action: ${artifact.action}`);
      console.log(`  Content length: ${artifact.content.length} characters`);
      console.log(`  Content preview (first 200 chars):`);
      console.log(`  ${artifact.content.substring(0, 200)}...`);
    }
    
    console.log('\n✓ Test 1 passed\n');
  } catch (error) {
    console.error('✗ Test 1 failed:', error);
    if (error instanceof BuilderAgentError) {
      console.error('  Error code:', error.code);
      console.error('  Details:', error.details);
    }
  }

  // Test 2: Error handling - Empty request
  console.log('\nTest 2: Error Handling (Empty Request)');
  console.log('----------------------------------------');
  
  try {
    const query: BuilderAgentQuery = {
      request: '',
    };

    await handleBuilderQuery(query);
    console.error('✗ Test 2 failed: Should have thrown error for empty request');
  } catch (error) {
    if (error instanceof BuilderAgentError && error.code === 'INVALID_REQUEST') {
      console.log('✓ Correctly rejected empty request');
      console.log(`  Error message: ${error.message}`);
      console.log('\n✓ Test 2 passed\n');
    } else {
      console.error('✗ Test 2 failed: Wrong error type or code');
    }
  }

  // Test 3: Complex request with multiple files
  console.log('\nTest 3: Multi-File Generation');
  console.log('------------------------------');
  
  try {
    const query: BuilderAgentQuery = {
      request: 'Create a simple todo list component with a TodoItem component and a TodoList component',
      context_file_paths: [],
    };

    const response = await handleBuilderQuery(query);
    
    console.log('✓ Request completed successfully');
    console.log(`  Summary: ${response.summary}`);
    console.log(`  Artifacts generated: ${response.artifacts.length}`);
    
    if (response.artifacts.length >= 2) {
      console.log('✓ Multiple files generated as expected');
    } else {
      console.log('⚠ Expected multiple files, got:', response.artifacts.length);
    }
    
    for (const artifact of response.artifacts) {
      console.log(`  - ${artifact.path} (${artifact.action})`);
    }
    
    console.log('\n✓ Test 3 passed\n');
  } catch (error) {
    console.error('✗ Test 3 failed:', error);
  }

  // Extract events before ending trace
  const currentTraceData = getCurrentTrace();
  const events = currentTraceData ? flattenEvents(currentTraceData.events) : [];
  
  // Finalize trace and check events
  const finalTrace = await endTrace();
  console.log('\nHarness Trace Summary');
  console.log('---------------------');
  console.log(`Total events logged: ${finalTrace.summary.total_events}`);
  console.log(`Total duration: ${finalTrace.summary.total_duration_ms}ms`);
  console.log(`Total tokens used: ${finalTrace.summary.total_tokens}`);
  
  console.log(`\nEvent types captured:`);
  const eventTypes = new Set(events.map(e => e.event_type));
  eventTypes.forEach(type => {
    const count = events.filter(e => e.event_type === type).length;
    console.log(`  - ${type}: ${count}`);
  });

  // Check for required events
  const hasActivityStart = events.some(e => e.event_type === 'AGENT_ACTIVITY_START');
  const hasActivityComplete = events.some(e => e.event_type === 'AGENT_ACTIVITY_COMPLETE');
  const hasToolInvocation = events.some(e => e.event_type === 'TOOL_INVOCATION');
  const hasProgress = events.some(e => e.event_type === 'AGENT_ACTIVITY_PROGRESS');

  console.log(`\nRequired trace events:`);
  console.log(`  ${hasActivityStart ? '✓' : '✗'} AGENT_ACTIVITY_START`);
  console.log(`  ${hasActivityComplete ? '✓' : '✗'} AGENT_ACTIVITY_COMPLETE`);
  console.log(`  ${hasToolInvocation ? '✓' : '✗'} TOOL_INVOCATION`);
  console.log(`  ${hasProgress ? '✓' : '✗'} AGENT_ACTIVITY_PROGRESS`);

  console.log('\n🎉 Builder Agent test complete!\n');
}

// Run the test
testBuilderAgent().catch((error) => {
  console.error('Fatal error during test:', error);
  process.exit(1);
});
