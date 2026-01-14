import { POST } from '@/app/api/packet/import/route';
import { getSession, getSessionPerspectives, getSessionAssumptions, getSessionDecisions } from '@/lib/pglite/sessions';
import { getDB } from '@/lib/pglite/client';
import type { DojoPacket } from '@/lib/packet/schema';

(async () => {
  console.log('Testing DojoPacket Import API...\n');

  const testUserId = 'dev@11-11.dev';
  const importedSessionIds: string[] = [];

  const validPacket: DojoPacket = {
    version: '1.0',
    session: {
      id: 'original-session-id',
      title: 'Import API Test Session',
      mode: 'Mirror',
      duration: 45,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      agent_path: ['Dojo', 'Mirror'],
    },
    situation: 'Testing import API functionality',
    stake: 'Ensure import API works correctly',
    perspectives: [
      {
        text: 'Import should restore all data',
        source: 'user' as const,
        timestamp: new Date().toISOString(),
      },
      {
        text: 'Agent agrees with approach',
        source: 'agent' as const,
        timestamp: new Date().toISOString(),
      },
    ],
    assumptions: [
      {
        text: 'API will validate packet schema',
        challenged: false,
        timestamp: new Date().toISOString(),
      },
      {
        text: 'Database will accept new session',
        challenged: true,
        timestamp: new Date().toISOString(),
      },
    ],
    decisions: [
      {
        text: 'Use Zod for validation',
        rationale: 'Type-safe and comprehensive',
        timestamp: new Date().toISOString(),
      },
    ],
    next_move: {
      action: 'Import packet',
      why: 'To verify API works',
      smallest_test: 'Call the API endpoint',
    },
    artifacts: [
      {
        type: 'code' as const,
        name: 'test.ts',
        content: 'console.log("test");',
        url: null,
      },
    ],
    trace_summary: {
      total_events: 42,
      agent_transitions: 3,
      cost_total: 0.025,
      tokens_total: 500,
    },
    metadata: {
      exported_at: new Date().toISOString(),
      exported_by: testUserId,
      format: 'json' as const,
    },
  };

  console.log('1. Testing valid packet import...');
  try {
    const request = new Request('http://localhost/api/packet/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPacket),
    });

    const response = await POST(request as any);

    if (response.status !== 201) {
      const errorBody = await response.json();
      throw new Error(`Expected status 201, got ${response.status}: ${JSON.stringify(errorBody)}`);
    }

    const body = await response.json();
    
    if (!body.success) {
      throw new Error('Expected success: true');
    }

    if (!body.sessionId) {
      throw new Error('Expected sessionId in response');
    }

    importedSessionIds.push(body.sessionId);

    const session = await getSession(body.sessionId);
    if (!session) {
      throw new Error('Session not found in database');
    }

    if (session.title !== validPacket.session.title) {
      throw new Error(`Expected title "${validPacket.session.title}", got "${session.title}"`);
    }

    if (session.mode !== validPacket.session.mode) {
      throw new Error(`Expected mode "${validPacket.session.mode}", got "${session.mode}"`);
    }

    if (session.situation !== validPacket.situation) {
      throw new Error(`Expected situation "${validPacket.situation}", got "${session.situation}"`);
    }

    const perspectives = await getSessionPerspectives(body.sessionId);
    if (perspectives.length !== validPacket.perspectives.length) {
      throw new Error(`Expected ${validPacket.perspectives.length} perspectives, got ${perspectives.length}`);
    }

    const assumptions = await getSessionAssumptions(body.sessionId);
    if (assumptions.length !== validPacket.assumptions.length) {
      throw new Error(`Expected ${validPacket.assumptions.length} assumptions, got ${assumptions.length}`);
    }

    const decisions = await getSessionDecisions(body.sessionId);
    if (decisions.length !== validPacket.decisions.length) {
      throw new Error(`Expected ${validPacket.decisions.length} decisions, got ${decisions.length}`);
    }

    console.log('✓ Valid packet imported successfully');
    console.log(`  - Status: ${response.status}`);
    console.log(`  - New session ID: ${body.sessionId}`);
    console.log(`  - Perspectives: ${perspectives.length}`);
    console.log(`  - Assumptions: ${assumptions.length}`);
    console.log(`  - Decisions: ${decisions.length}`);
  } catch (error) {
    console.error('✗ Valid packet import failed:', error);
    process.exit(1);
  }

  console.log('\n2. Testing invalid packet schema...');
  try {
    const invalidPacket = {
      version: '2.0',
      session: { id: 'test' },
    };

    const request = new Request('http://localhost/api/packet/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPacket),
    });

    const response = await POST(request as any);

    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }

    const body = await response.json();
    if (!body.error || !body.error.includes('Invalid DojoPacket format')) {
      throw new Error('Expected "Invalid DojoPacket format" error message');
    }

    if (!body.details) {
      throw new Error('Expected validation details in response');
    }

    console.log('✓ Invalid packet schema rejected');
    console.log(`  - Status: ${response.status}`);
    console.log(`  - Error: ${body.error}`);
  } catch (error) {
    console.error('✗ Invalid schema test failed:', error);
    process.exit(1);
  }

  console.log('\n3. Testing missing required fields...');
  try {
    const incompletePacket = {
      version: '1.0',
      session: validPacket.session,
    };

    const request = new Request('http://localhost/api/packet/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incompletePacket),
    });

    const response = await POST(request as any);

    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }

    const body = await response.json();
    if (!body.error) {
      throw new Error('Expected error field in response');
    }

    console.log('✓ Incomplete packet rejected');
    console.log(`  - Status: ${response.status}`);
    console.log(`  - Error: ${body.error}`);
  } catch (error) {
    console.error('✗ Incomplete packet test failed:', error);
    process.exit(1);
  }

  console.log('\n4. Testing malformed JSON...');
  try {
    const request = new Request('http://localhost/api/packet/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json',
    });

    const response = await POST(request as any);

    if (response.status < 400) {
      throw new Error(`Expected error status, got ${response.status}`);
    }

    console.log('✓ Malformed JSON rejected');
    console.log(`  - Status: ${response.status}`);
  } catch (error) {
    console.error('✗ Malformed JSON test failed:', error);
    process.exit(1);
  }

  console.log('\n5. Testing packet with empty arrays...');
  try {
    const emptyPacket: DojoPacket = {
      ...validPacket,
      perspectives: [],
      assumptions: [],
      decisions: [],
      artifacts: [],
    };

    const request = new Request('http://localhost/api/packet/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emptyPacket),
    });

    const response = await POST(request as any);

    if (response.status !== 201) {
      const errorBody = await response.json();
      throw new Error(`Expected status 201, got ${response.status}: ${JSON.stringify(errorBody)}`);
    }

    const body = await response.json();
    importedSessionIds.push(body.sessionId);

    const perspectives = await getSessionPerspectives(body.sessionId);
    const assumptions = await getSessionAssumptions(body.sessionId);
    const decisions = await getSessionDecisions(body.sessionId);

    if (perspectives.length !== 0 || assumptions.length !== 0 || decisions.length !== 0) {
      throw new Error('Expected empty arrays to result in no related records');
    }

    console.log('✓ Empty arrays handled correctly');
    console.log(`  - Status: ${response.status}`);
    console.log(`  - Session ID: ${body.sessionId}`);
  } catch (error) {
    console.error('✗ Empty arrays test failed:', error);
    process.exit(1);
  }

  console.log('\n6. Testing packet with null optional fields...');
  try {
    const nullFieldsPacket: DojoPacket = {
      ...validPacket,
      stake: null,
      next_move: {
        action: 'Test action',
        why: 'Test reason',
        smallest_test: null,
      },
    };

    const request = new Request('http://localhost/api/packet/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nullFieldsPacket),
    });

    const response = await POST(request as any);

    if (response.status !== 201) {
      const errorBody = await response.json();
      throw new Error(`Expected status 201, got ${response.status}: ${JSON.stringify(errorBody)}`);
    }

    const body = await response.json();
    importedSessionIds.push(body.sessionId);

    const session = await getSession(body.sessionId);
    if (session?.stake !== null) {
      throw new Error('Expected stake to be null');
    }

    console.log('✓ Null optional fields handled correctly');
    console.log(`  - Status: ${response.status}`);
    console.log(`  - Session ID: ${body.sessionId}`);
  } catch (error) {
    console.error('✗ Null fields test failed:', error);
    process.exit(1);
  }

  console.log('\n7. Cleaning up imported sessions...');
  try {
    const db = await getDB();
    
    for (const sessionId of importedSessionIds) {
      await db.query('DELETE FROM session_decisions WHERE session_id = $1', [sessionId]);
      await db.query('DELETE FROM session_assumptions WHERE session_id = $1', [sessionId]);
      await db.query('DELETE FROM session_perspectives WHERE session_id = $1', [sessionId]);
      await db.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
    }

    console.log('✓ Imported sessions cleaned up');
    console.log(`  - Cleaned ${importedSessionIds.length} sessions`);
  } catch (error) {
    console.error('✗ Failed to clean up imported sessions:', error);
    process.exit(1);
  }

  console.log('\n✅ All Import API tests passed!\n');
  process.exit(0);
})();
