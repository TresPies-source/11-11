import { POST } from '@/app/api/packet/export/route';
import { insertSession, insertSessionPerspective, insertSessionAssumption, insertSessionDecision } from '@/lib/pglite/sessions';
import { getDB } from '@/lib/pglite/client';
import { randomUUID } from 'crypto';

(async () => {
  console.log('Testing DojoPacket Export API...\n');

  const testUserId = 'dev@11-11.dev';

  console.log('1. Setting up test session...');
  let testSessionId: string;
  try {
    const session = await insertSession({
      user_id: testUserId,
      title: 'Export API Test Session',
      mode: 'Mirror',
      situation: 'Testing export API functionality',
      stake: 'Ensure export API works correctly',
      agent_path: ['Dojo', 'Mirror'],
      next_move_action: 'Export packet',
      next_move_why: 'To verify API works',
      next_move_test: 'Call the API endpoint',
      artifacts: [],
      total_tokens: 500,
      total_cost_usd: 0.025,
    });

    testSessionId = session.id;

    await insertSessionPerspective({
      session_id: testSessionId,
      text: 'API test perspective',
      source: 'user',
    });

    await insertSessionAssumption({
      session_id: testSessionId,
      text: 'Export should work',
      challenged: false,
    });

    await insertSessionDecision({
      session_id: testSessionId,
      text: 'Use POST endpoint',
      rationale: 'Standard REST practice',
    });

    console.log('✓ Test session created');
    console.log(`  - Session ID: ${testSessionId}`);
  } catch (error) {
    console.error('✗ Failed to create test session:', error);
    process.exit(1);
  }

  console.log('\n2. Testing JSON export (valid request)...');
  try {
    const request = new Request('http://localhost/api/packet/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: testSessionId, format: 'json' }),
    });

    const response = await POST(request as any);

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType?.includes('application/json')) {
      throw new Error(`Expected Content-Type application/json, got ${contentType}`);
    }

    const contentDisposition = response.headers.get('Content-Disposition');
    if (!contentDisposition?.includes(`dojopacket-${testSessionId}.json`)) {
      throw new Error(`Invalid Content-Disposition header: ${contentDisposition}`);
    }

    const body = await response.text();
    const packet = JSON.parse(body);

    if (packet.version !== '1.0') {
      throw new Error('Invalid packet version');
    }

    if (packet.session.id !== testSessionId) {
      throw new Error('Invalid session ID in packet');
    }

    console.log('✓ JSON export successful');
    console.log(`  - Status: ${response.status}`);
    console.log(`  - Content-Type: ${contentType}`);
    console.log(`  - Packet version: ${packet.version}`);
  } catch (error) {
    console.error('✗ JSON export failed:', error);
    process.exit(1);
  }

  console.log('\n3. Testing Markdown export...');
  try {
    const request = new Request('http://localhost/api/packet/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: testSessionId, format: 'markdown' }),
    });

    const response = await POST(request as any);

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType?.includes('text/markdown')) {
      throw new Error(`Expected Content-Type text/markdown, got ${contentType}`);
    }

    const contentDisposition = response.headers.get('Content-Disposition');
    if (!contentDisposition?.includes(`dojopacket-${testSessionId}.md`)) {
      throw new Error(`Invalid Content-Disposition header: ${contentDisposition}`);
    }

    const body = await response.text();

    if (!body.includes('# Export API Test Session')) {
      throw new Error('Missing session title in Markdown');
    }

    if (!body.includes('## Situation')) {
      throw new Error('Missing situation section in Markdown');
    }

    console.log('✓ Markdown export successful');
    console.log(`  - Status: ${response.status}`);
    console.log(`  - Content-Type: ${contentType}`);
    console.log(`  - Body length: ${body.length} characters`);
  } catch (error) {
    console.error('✗ Markdown export failed:', error);
    process.exit(1);
  }

  console.log('\n4. Testing PDF export...');
  try {
    const request = new Request('http://localhost/api/packet/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: testSessionId, format: 'pdf' }),
    });

    const response = await POST(request as any);

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType?.includes('application/pdf')) {
      throw new Error(`Expected Content-Type application/pdf, got ${contentType}`);
    }

    const contentDisposition = response.headers.get('Content-Disposition');
    if (!contentDisposition?.includes(`dojopacket-${testSessionId}.pdf`)) {
      throw new Error(`Invalid Content-Disposition header: ${contentDisposition}`);
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
      throw new Error('Response is not a valid PDF (missing PDF signature)');
    }

    console.log('✓ PDF export successful');
    console.log(`  - Status: ${response.status}`);
    console.log(`  - Content-Type: ${contentType}`);
    console.log(`  - PDF size: ${buffer.byteLength} bytes`);
  } catch (error) {
    console.error('✗ PDF export failed:', error);
    console.error('  (This might fail if manus-md-to-pdf is not installed)');
  }

  console.log('\n5. Testing invalid format...');
  try {
    const request = new Request('http://localhost/api/packet/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: testSessionId, format: 'invalid' }),
    });

    const response = await POST(request as any);

    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }

    const body = await response.json();
    if (!body.error) {
      throw new Error('Expected error field in response');
    }

    console.log('✓ Invalid format rejected');
    console.log(`  - Status: ${response.status}`);
    console.log(`  - Error: ${body.error}`);
  } catch (error) {
    console.error('✗ Invalid format test failed:', error);
    process.exit(1);
  }

  console.log('\n6. Testing missing sessionId...');
  try {
    const request = new Request('http://localhost/api/packet/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'json' }),
    });

    const response = await POST(request as any);

    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }

    const body = await response.json();
    if (!body.error) {
      throw new Error('Expected error field in response');
    }

    console.log('✓ Missing sessionId rejected');
    console.log(`  - Status: ${response.status}`);
    console.log(`  - Error: ${body.error}`);
  } catch (error) {
    console.error('✗ Missing sessionId test failed:', error);
    process.exit(1);
  }

  console.log('\n7. Testing non-existent session...');
  try {
    const nonExistentId = randomUUID();
    const request = new Request('http://localhost/api/packet/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: nonExistentId, format: 'json' }),
    });

    const response = await POST(request as any);

    if (response.status !== 404) {
      throw new Error(`Expected status 404, got ${response.status}`);
    }

    const body = await response.json();
    if (!body.error || !body.error.includes('not found')) {
      throw new Error('Expected "not found" error message');
    }

    console.log('✓ Non-existent session returns 404');
    console.log(`  - Status: ${response.status}`);
    console.log(`  - Error: ${body.error}`);
  } catch (error) {
    console.error('✗ Non-existent session test failed:', error);
    process.exit(1);
  }

  console.log('\n8. Testing malformed JSON...');
  try {
    const request = new Request('http://localhost/api/packet/export', {
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

  console.log('\n✅ All Export API tests passed!\n');
  process.exit(0);
})();
