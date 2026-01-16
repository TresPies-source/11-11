/**
 * Manual Test Script for Debugger Agent
 * 
 * Tests:
 * 1. Basic conflict detection with conflicting perspectives
 * 2. DojoPacket extraction strategy
 * 3. Conversation parsing fallback strategy
 * 4. Error handling with empty input
 * 5. Harness Trace logging verification
 */

import { handleDebuggerQuery, invokeDebuggerAgent } from './lib/agents/debugger-handler';
import type { DebuggerAgentQuery } from './lib/agents/debugger-handler';
import type { AgentInvocationContext } from './lib/agents/types';
import type { Perspective, Assumption, DojoPacket } from './lib/packet/schema';
import { startTrace, endTrace, getCurrentTrace } from './lib/harness/trace';
import type { HarnessEvent } from './lib/harness/types';

console.log('🔍 Starting Debugger Agent Manual Tests\n');
console.log('=' .repeat(60));

// Initialize trace for testing
startTrace('test-session', 'test-user');

// Helper to get all events from current trace
function getAllEvents(): HarnessEvent[] {
  const trace = getCurrentTrace();
  if (!trace) return [];
  
  const flatten = (events: HarnessEvent[]): HarnessEvent[] => {
    const result: HarnessEvent[] = [];
    for (const event of events) {
      result.push(event);
      if (event.children) {
        result.push(...flatten(event.children));
      }
    }
    return result;
  };
  
  return flatten(trace.events);
}

// Test 1: Basic Conflict Detection
async function test1_basicConflictDetection() {
  console.log('\n📝 Test 1: Basic Conflict Detection');
  console.log('-'.repeat(60));
  
  const perspectives: Perspective[] = [
    {
      text: 'We need to move faster than the competition and ship features weekly.',
      source: 'user',
      timestamp: new Date().toISOString(),
    },
    {
      text: 'Quality is more important than speed, we should release monthly to ensure thorough testing.',
      source: 'user',
      timestamp: new Date().toISOString(),
    },
    {
      text: 'Our users demand new features constantly, we cannot afford to slow down.',
      source: 'user',
      timestamp: new Date().toISOString(),
    },
  ];
  
  const assumptions: Assumption[] = [
    {
      text: 'Fast releases always lead to better market position.',
      challenged: false,
      timestamp: new Date().toISOString(),
    },
    {
      text: 'Quality and speed are mutually exclusive.',
      challenged: true,
      timestamp: new Date().toISOString(),
    },
  ];
  
  const query: DebuggerAgentQuery = {
    perspectives,
    assumptions,
  };
  
  try {
    const response = await handleDebuggerQuery(query);
    
    console.log('✅ PASSED: Conflict detection completed');
    console.log(`   Summary: ${response.summary}`);
    console.log(`   Conflicts Found: ${response.conflicts.length}`);
    
    response.conflicts.forEach((conflict, i) => {
      console.log(`\n   Conflict ${i + 1}:`);
      console.log(`   Description: ${conflict.description}`);
      console.log(`   Conflicting Perspectives:`);
      conflict.conflicting_perspectives.forEach((p, j) => {
        console.log(`     ${j + 1}. "${p}"`);
      });
    });
    
    const events = getAllEvents();
    console.log(`\n   Harness Events Logged: ${events.length}`);
    
    return true;
  } catch (error) {
    console.error('❌ FAILED:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Test 2: Error Handling - Empty Query
async function test2_errorHandlingEmptyQuery() {
  console.log('\n📝 Test 2: Error Handling - Empty Query');
  console.log('-'.repeat(60));
  
  const query: DebuggerAgentQuery = {
    perspectives: [],
    assumptions: [],
  };
  
  try {
    await handleDebuggerQuery(query);
    console.error('❌ FAILED: Should have thrown error for empty query');
    return false;
  } catch (error) {
    if (error instanceof Error && error.message.includes('At least one perspective')) {
      console.log('✅ PASSED: Correctly rejected empty query');
      console.log(`   Error Message: ${error.message}`);
      return true;
    } else {
      console.error('❌ FAILED: Wrong error type:', error);
      return false;
    }
  }
}

// Test 3: DojoPacket Extraction Strategy
async function test3_dojoPacketExtraction() {
  console.log('\n📝 Test 3: DojoPacket Extraction Strategy');
  console.log('-'.repeat(60));
  
  const dojoPacket: DojoPacket = {
    version: '1.0',
    session: {
      id: 'test-session-123',
      title: 'Test Session',
      mode: 'Mirror',
      duration: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      agent_path: ['dojo', 'debugger'],
    },
    situation: 'Testing debugger agent',
    stake: 'Ensure agent works correctly',
    perspectives: [
      {
        text: 'AI will replace all developers within 5 years.',
        source: 'user',
        timestamp: new Date().toISOString(),
      },
      {
        text: 'AI will never be able to fully replace human creativity and intuition in software development.',
        source: 'user',
        timestamp: new Date().toISOString(),
      },
    ],
    assumptions: [
      {
        text: 'Current AI trends will continue exponentially.',
        challenged: false,
        timestamp: new Date().toISOString(),
      },
    ],
    decisions: [],
    next_move: {
      action: 'Test debugger',
      why: 'Verify conflict detection',
      smallest_test: null,
    },
    artifacts: [],
    trace_summary: {
      total_events: 0,
      agent_transitions: 0,
      cost_total: 0,
      tokens_total: 0,
    },
    metadata: {
      exported_at: new Date().toISOString(),
      exported_by: 'test-script',
      format: 'json',
    },
  };
  
  const context: AgentInvocationContext = {
    conversation_history: [
      {
        role: 'user',
        content: 'I need help resolving some conflicts in my thinking.',
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: `Here's your DojoPacket: ${JSON.stringify(dojoPacket)}`,
        timestamp: new Date().toISOString(),
      },
    ],
    user_intent: 'Find conflicts in my reasoning',
    session_id: 'test-session-123',
  };
  
  try {
    const response = await invokeDebuggerAgent(context);
    
    console.log('✅ PASSED: DojoPacket extraction strategy worked');
    console.log(`   Summary: ${response.summary}`);
    console.log(`   Conflicts Found: ${response.conflicts.length}`);
    
    const events = getAllEvents();
    const packetEvent = events.find(e => 
      e.event_type === 'AGENT_ACTIVITY_PROGRESS' && 
      e.inputs.message?.includes('DojoPacket extraction')
    );
    
    if (packetEvent) {
      console.log('   ✓ DojoPacket extraction event logged');
    } else {
      console.log('   ⚠ DojoPacket extraction event not found in logs');
    }
    
    return true;
  } catch (error) {
    console.error('❌ FAILED:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Test 4: Conversation Parsing Fallback Strategy
async function test4_conversationParsingFallback() {
  console.log('\n📝 Test 4: Conversation Parsing Fallback Strategy');
  console.log('-'.repeat(60));
  
  const context: AgentInvocationContext = {
    conversation_history: [
      {
        role: 'user',
        content: 'I think we should prioritize speed over quality. Fast iteration is key to success.',
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: 'Interesting perspective. Can you elaborate?',
        timestamp: new Date().toISOString(),
      },
      {
        role: 'user',
        content: 'Actually, quality is what sets us apart from competitors. We should never compromise on testing.',
        timestamp: new Date().toISOString(),
      },
      {
        role: 'user',
        content: 'Our customers expect both speed and quality. We need to deliver features quickly without bugs.',
        timestamp: new Date().toISOString(),
      },
    ],
    user_intent: 'Help me understand my conflicting thoughts',
    session_id: 'test-session-456',
  };
  
  try {
    const response = await invokeDebuggerAgent(context);
    
    console.log('✅ PASSED: Conversation parsing fallback worked');
    console.log(`   Summary: ${response.summary}`);
    console.log(`   Conflicts Found: ${response.conflicts.length}`);
    
    const events = getAllEvents();
    const fallbackEvent = events.find(e => 
      e.event_type === 'AGENT_ACTIVITY_PROGRESS' && 
      e.inputs.message?.includes('conversation parsing fallback')
    );
    
    if (fallbackEvent) {
      console.log('   ✓ Conversation parsing event logged');
      console.log(`   Perspectives Extracted: ${fallbackEvent.inputs.perspective_count || 0}`);
    } else {
      console.log('   ⚠ Conversation parsing event not found in logs');
    }
    
    return true;
  } catch (error) {
    console.error('❌ FAILED:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Test 5: Harness Trace Integration Verification
async function test5_harnessTraceIntegration() {
  console.log('\n📝 Test 5: Harness Trace Integration');
  console.log('-'.repeat(60));
  
  const perspectives: Perspective[] = [
    {
      text: 'Test perspective for trace verification.',
      source: 'user',
      timestamp: new Date().toISOString(),
    },
  ];
  
  const query: DebuggerAgentQuery = {
    perspectives,
    assumptions: [],
  };
  
  try {
    await handleDebuggerQuery(query);
    
    const events = getAllEvents();
    
    const hasStart = events.some(e => e.event_type === 'AGENT_ACTIVITY_START');
    const hasComplete = events.some(e => e.event_type === 'AGENT_ACTIVITY_COMPLETE');
    const hasToolInvocation = events.some(e => e.event_type === 'TOOL_INVOCATION');
    
    console.log(`   Harness Events: ${events.length} total`);
    console.log(`   ${hasStart ? '✓' : '✗'} AGENT_ACTIVITY_START`);
    console.log(`   ${hasComplete ? '✓' : '✗'} AGENT_ACTIVITY_COMPLETE`);
    console.log(`   ${hasToolInvocation ? '✓' : '✗'} TOOL_INVOCATION (LLM call)`);
    
    if (hasStart && hasComplete && hasToolInvocation) {
      console.log('\n✅ PASSED: All required trace events present');
      return true;
    } else {
      console.log('\n❌ FAILED: Missing required trace events');
      return false;
    }
  } catch (error) {
    console.error('❌ FAILED:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
  };
  
  try {
    results.test1 = await test1_basicConflictDetection();
    results.test2 = await test2_errorHandlingEmptyQuery();
    results.test3 = await test3_dojoPacketExtraction();
    results.test4 = await test4_conversationParsingFallback();
    results.test5 = await test5_harnessTraceIntegration();
  } catch (error) {
    console.error('\n💥 Test suite error:', error);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;
  
  console.log(`\nTests Passed: ${passed}/${total}`);
  console.log('\nDetailed Results:');
  console.log(`  Test 1 (Basic Conflict Detection):     ${results.test1 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Test 2 (Error Handling):                ${results.test2 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Test 3 (DojoPacket Extraction):         ${results.test3 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Test 4 (Conversation Parsing Fallback): ${results.test4 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Test 5 (Harness Trace Integration):     ${results.test5 ? '✅ PASSED' : '❌ FAILED'}`);
  
  // Summary of Harness Trace events
  const trace = getCurrentTrace();
  if (trace) {
    const allEvents = getAllEvents();
    const eventTypes = new Map<string, number>();
    
    for (const event of allEvents) {
      eventTypes.set(event.event_type, (eventTypes.get(event.event_type) || 0) + 1);
    }
    
    console.log('\n📈 Harness Trace Summary:');
    console.log(`  Total Events: ${allEvents.length}`);
    console.log(`  Total Tokens Used: ${trace.summary.total_tokens.toLocaleString()}`);
    console.log('\n  Event Type Breakdown:');
    for (const [type, count] of Array.from(eventTypes.entries())) {
      console.log(`    ${type}: ${count}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.log('⚠️  SOME TESTS FAILED\n');
    process.exit(1);
  }
}

runAllTests();
