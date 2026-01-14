import { buildDojoPacket } from './builder';
import { DojoPacketSchema } from './schema';
import { insertSession, insertSessionPerspective, insertSessionAssumption, insertSessionDecision } from '../pglite/sessions';
import { getDB } from '../pglite/client';
import { randomUUID } from 'crypto';

(async () => {
  console.log('Testing DojoPacket Builder...\n');

  const testUserId = 'test_user_123';
  let testSessionId: string;

  console.log('1. Setting up test session...');
  try {
    const session = await insertSession({
      user_id: testUserId,
      title: 'Test DojoPacket Session',
      mode: 'Mirror',
      situation: 'I need to understand how to export session data',
      stake: 'Learning DojoPacket export functionality',
      agent_path: ['Supervisor', 'Dojo', 'Mirror'],
      next_move_action: 'Test the export functionality',
      next_move_why: 'To verify the DojoPacket builder works correctly',
      next_move_test: 'Create a test session and export it',
      artifacts: [
        {
          type: 'code',
          name: 'test.ts',
          content: 'console.log("test");',
          url: null,
        },
      ],
      total_tokens: 1000,
      total_cost_usd: 0.05,
    });

    testSessionId = session.id;

    console.log('✓ Test session created');
    console.log(`  - Session ID: ${session.id}`);
    console.log(`  - Title: ${session.title}`);
  } catch (error) {
    console.error('✗ Failed to create test session:', error);
    process.exit(1);
  }

  console.log('\n2. Adding perspectives...');
  try {
    await insertSessionPerspective({
      session_id: testSessionId,
      text: 'User wants to export session data',
      source: 'user',
    });

    await insertSessionPerspective({
      session_id: testSessionId,
      text: 'Agent suggests using DojoPacket format',
      source: 'agent',
    });

    console.log('✓ Perspectives added successfully');
  } catch (error) {
    console.error('✗ Failed to add perspectives:', error);
    process.exit(1);
  }

  console.log('\n3. Adding assumptions...');
  try {
    await insertSessionAssumption({
      session_id: testSessionId,
      text: 'User is familiar with JSON format',
      challenged: false,
    });

    await insertSessionAssumption({
      session_id: testSessionId,
      text: 'Export should be instant',
      challenged: true,
    });

    console.log('✓ Assumptions added successfully');
  } catch (error) {
    console.error('✗ Failed to add assumptions:', error);
    process.exit(1);
  }

  console.log('\n4. Adding decisions...');
  try {
    await insertSessionDecision({
      session_id: testSessionId,
      text: 'Use DojoPacket v1.0 schema',
      rationale: 'Standardized format ensures portability',
    });

    console.log('✓ Decisions added successfully');
  } catch (error) {
    console.error('✗ Failed to add decisions:', error);
    process.exit(1);
  }

  console.log('\n5. Building DojoPacket...');
  try {
    const packet = await buildDojoPacket(testSessionId);

    if (packet.version !== '1.0') {
      throw new Error(`Version mismatch: expected '1.0', got '${packet.version}'`);
    }

    if (packet.session.id !== testSessionId) {
      throw new Error(`Session ID mismatch: expected '${testSessionId}', got '${packet.session.id}'`);
    }

    if (packet.session.title !== 'Test DojoPacket Session') {
      throw new Error(`Title mismatch: expected 'Test DojoPacket Session', got '${packet.session.title}'`);
    }

    if (packet.session.mode !== 'Mirror') {
      throw new Error(`Mode mismatch: expected 'Mirror', got '${packet.session.mode}'`);
    }

    if (packet.situation !== 'I need to understand how to export session data') {
      throw new Error('Situation mismatch');
    }

    if (packet.stake !== 'Learning DojoPacket export functionality') {
      throw new Error('Stake mismatch');
    }

    if (packet.perspectives.length !== 2) {
      throw new Error(`Expected 2 perspectives, got ${packet.perspectives.length}`);
    }

    if (packet.assumptions.length !== 2) {
      throw new Error(`Expected 2 assumptions, got ${packet.assumptions.length}`);
    }

    if (packet.decisions.length !== 1) {
      throw new Error(`Expected 1 decision, got ${packet.decisions.length}`);
    }

    if (packet.next_move.action !== 'Test the export functionality') {
      throw new Error('Next move action mismatch');
    }

    if (packet.artifacts.length !== 1) {
      throw new Error(`Expected 1 artifact, got ${packet.artifacts.length}`);
    }

    if (packet.trace_summary.total_events < 0) {
      throw new Error('Invalid total_events count');
    }

    console.log('✓ DojoPacket built successfully');
    console.log(`  - Version: ${packet.version}`);
    console.log(`  - Session ID: ${packet.session.id}`);
    console.log(`  - Title: ${packet.session.title}`);
    console.log(`  - Mode: ${packet.session.mode}`);
    console.log(`  - Perspectives: ${packet.perspectives.length}`);
    console.log(`  - Assumptions: ${packet.assumptions.length}`);
    console.log(`  - Decisions: ${packet.decisions.length}`);
    console.log(`  - Artifacts: ${packet.artifacts.length}`);
    console.log(`  - Trace Events: ${packet.trace_summary.total_events}`);
  } catch (error) {
    console.error('✗ Failed to build DojoPacket:', error);
    process.exit(1);
  }

  console.log('\n6. Validating DojoPacket schema...');
  try {
    const packet = await buildDojoPacket(testSessionId);
    const validated = DojoPacketSchema.parse(packet);

    console.log('✓ DojoPacket schema validation passed');
    console.log(`  - All fields conform to DojoPacket v1.0 schema`);
  } catch (error) {
    console.error('✗ Schema validation failed:', error);
    process.exit(1);
  }

  console.log('\n7. Testing non-existent session...');
  try {
    const nonExistentId = randomUUID();
    await buildDojoPacket(nonExistentId);
    console.error('✗ Should have thrown error for non-existent session');
    process.exit(1);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      console.log('✓ Correctly throws error for non-existent session');
    } else {
      console.error('✗ Unexpected error:', error);
      process.exit(1);
    }
  }

  console.log('\n8. Testing trace summary fallback...');
  try {
    const packet = await buildDojoPacket(testSessionId);
    
    if (typeof packet.trace_summary.total_events !== 'number') {
      throw new Error('trace_summary.total_events should be a number');
    }
    if (typeof packet.trace_summary.agent_transitions !== 'number') {
      throw new Error('trace_summary.agent_transitions should be a number');
    }
    if (typeof packet.trace_summary.cost_total !== 'number') {
      throw new Error('trace_summary.cost_total should be a number');
    }
    if (typeof packet.trace_summary.tokens_total !== 'number') {
      throw new Error('trace_summary.tokens_total should be a number');
    }

    console.log('✓ Trace summary gracefully handles missing trace data');
    console.log(`  - Total events: ${packet.trace_summary.total_events}`);
    console.log(`  - Agent transitions: ${packet.trace_summary.agent_transitions}`);
    console.log(`  - Cost: $${packet.trace_summary.cost_total.toFixed(4)}`);
    console.log(`  - Tokens: ${packet.trace_summary.tokens_total}`);
  } catch (error) {
    console.error('✗ Trace summary fallback failed:', error);
    process.exit(1);
  }

  console.log('\n9. Cleaning up test session...');
  try {
    const db = await getDB();
    await db.query('DELETE FROM session_decisions WHERE session_id = $1', [testSessionId]);
    await db.query('DELETE FROM session_assumptions WHERE session_id = $1', [testSessionId]);
    await db.query('DELETE FROM session_perspectives WHERE session_id = $1', [testSessionId]);
    await db.query('DELETE FROM sessions WHERE id = $1', [testSessionId]);
    
    console.log('✓ Test session cleaned up');
  } catch (error) {
    console.error('✗ Failed to clean up test session:', error);
    process.exit(1);
  }

  console.log('\n✅ All DojoPacket Builder tests passed!\n');
  process.exit(0);
})();
