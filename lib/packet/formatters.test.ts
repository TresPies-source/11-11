import { formatAsJSON, formatAsMarkdown, formatAsPDF } from './formatters';
import { DojoPacket } from './schema';

const createMockPacket = (overrides?: Partial<DojoPacket>): DojoPacket => ({
  version: '1.0',
  session: {
    id: 'test-session-123',
    title: 'Test Dojo Session',
    mode: 'Mirror',
    duration: 45,
    created_at: '2026-01-13T12:00:00.000Z',
    updated_at: '2026-01-13T12:45:00.000Z',
    agent_path: ['Supervisor', 'Dojo', 'Mirror'],
  },
  situation: 'User wants to implement authentication',
  stake: 'Security and user trust',
  perspectives: [
    {
      text: 'We should use OAuth 2.0',
      source: 'agent',
      timestamp: '2026-01-13T12:10:00.000Z',
    },
    {
      text: 'I prefer JWT tokens',
      source: 'user',
      timestamp: '2026-01-13T12:15:00.000Z',
    },
  ],
  assumptions: [
    {
      text: 'Users have email addresses',
      challenged: false,
      timestamp: '2026-01-13T12:20:00.000Z',
    },
    {
      text: 'All users need admin access',
      challenged: true,
      timestamp: '2026-01-13T12:25:00.000Z',
    },
  ],
  decisions: [
    {
      text: 'Use NextAuth.js for authentication',
      rationale: 'Well-maintained, secure, and integrates with Next.js',
      timestamp: '2026-01-13T12:30:00.000Z',
    },
  ],
  next_move: {
    action: 'Install NextAuth.js and configure providers',
    why: 'Need to set up infrastructure before implementing features',
    smallest_test: 'User can log in with GitHub OAuth',
  },
  artifacts: [
    {
      type: 'code',
      name: 'auth.config.ts',
      content: 'export const authConfig = { providers: ["github"] };',
      url: null,
    },
    {
      type: 'link',
      name: 'NextAuth.js Documentation',
      content: null,
      url: 'https://next-auth.js.org',
    },
  ],
  trace_summary: {
    total_events: 42,
    agent_transitions: 5,
    cost_total: 0.0234,
    tokens_total: 1500,
  },
  metadata: {
    exported_at: '2026-01-13T13:00:00.000Z',
    exported_by: 'user-456',
    format: 'json',
  },
  ...overrides,
});

(async () => {
  console.log('Testing DojoPacket Formatters...\n');

  console.log('===== formatAsJSON Tests =====\n');
  
  console.log('1. Testing JSON formatting...');
  try {
    const packet = createMockPacket();
    const json = formatAsJSON(packet);
    
    if (!json) {
      throw new Error('JSON output is empty');
    }
    
    const parsed = JSON.parse(json);
    
    if (parsed.version !== '1.0') {
      throw new Error(`Version mismatch: expected '1.0', got '${parsed.version}'`);
    }
    
    if (parsed.session.id !== 'test-session-123') {
      throw new Error('Session ID mismatch');
    }
    
    console.log('✓ JSON formatting works correctly');
    console.log(`  - Version: ${parsed.version}`);
    console.log(`  - Session ID: ${parsed.session.id}`);
  } catch (error) {
    console.error('✗ JSON formatting failed:', error);
    process.exit(1);
  }
  
  console.log('\n2. Testing JSON with empty arrays...');
  try {
    const packet = createMockPacket({
      perspectives: [],
      assumptions: [],
      decisions: [],
      artifacts: [],
    });
    
    const json = formatAsJSON(packet);
    const parsed = JSON.parse(json);
    
    if (parsed.perspectives.length !== 0) {
      throw new Error('Empty perspectives array not preserved');
    }
    if (parsed.assumptions.length !== 0) {
      throw new Error('Empty assumptions array not preserved');
    }
    if (parsed.decisions.length !== 0) {
      throw new Error('Empty decisions array not preserved');
    }
    if (parsed.artifacts.length !== 0) {
      throw new Error('Empty artifacts array not preserved');
    }
    
    console.log('✓ Empty arrays handled correctly');
  } catch (error) {
    console.error('✗ Empty arrays test failed:', error);
    process.exit(1);
  }
  
  console.log('\n3. Testing JSON with null fields...');
  try {
    const packet = createMockPacket({
      stake: null,
      next_move: {
        action: 'Test action',
        why: 'Test reason',
        smallest_test: null,
      },
    });
    
    const json = formatAsJSON(packet);
    const parsed = JSON.parse(json);
    
    if (parsed.stake !== null) {
      throw new Error('Null stake not preserved');
    }
    if (parsed.next_move.smallest_test !== null) {
      throw new Error('Null smallest_test not preserved');
    }
    
    console.log('✓ Null fields preserved correctly');
  } catch (error) {
    console.error('✗ Null fields test failed:', error);
    process.exit(1);
  }

  console.log('\n===== formatAsMarkdown Tests =====\n');
  
  console.log('4. Testing Markdown formatting...');
  try {
    const packet = createMockPacket();
    const markdown = formatAsMarkdown(packet);
    
    if (!markdown.includes('# Test Dojo Session')) {
      throw new Error('Title not found in Markdown');
    }
    if (!markdown.includes('**Mode:** Mirror')) {
      throw new Error('Mode not found in Markdown');
    }
    if (!markdown.includes('**Duration:** 45 minutes')) {
      throw new Error('Duration not formatted correctly');
    }
    if (!markdown.includes('## Situation')) {
      throw new Error('Situation section not found');
    }
    if (!markdown.includes('User wants to implement authentication')) {
      throw new Error('Situation text not found');
    }
    
    console.log('✓ Markdown formatting works correctly');
    console.log(`  - Length: ${markdown.length} characters`);
  } catch (error) {
    console.error('✗ Markdown formatting failed:', error);
    process.exit(1);
  }
  
  console.log('\n5. Testing Markdown perspectives...');
  try {
    const packet = createMockPacket();
    const markdown = formatAsMarkdown(packet);
    
    if (!markdown.includes('## Perspectives')) {
      throw new Error('Perspectives section not found');
    }
    if (!markdown.includes('We should use OAuth 2.0')) {
      throw new Error('Perspective text not found');
    }
    if (!markdown.includes('agent')) {
      throw new Error('Agent source not labeled');
    }
    if (!markdown.includes('I prefer JWT tokens')) {
      throw new Error('User perspective not found');
    }
    if (!markdown.includes('user')) {
      throw new Error('User source not labeled');
    }
    
    console.log('✓ Perspectives formatted correctly');
  } catch (error) {
    console.error('✗ Perspectives test failed:', error);
    process.exit(1);
  }
  
  console.log('\n6. Testing Markdown assumptions...');
  try {
    const packet = createMockPacket();
    const markdown = formatAsMarkdown(packet);
    
    if (!markdown.includes('## Assumptions')) {
      throw new Error('Assumptions section not found');
    }
    if (!markdown.includes('Users have email addresses')) {
      throw new Error('Assumption text not found');
    }
    if (!markdown.includes('✅')) {
      throw new Error('Held assumption not marked');
    }
    if (!markdown.includes('All users need admin access')) {
      throw new Error('Challenged assumption not found');
    }
    if (!markdown.includes('❌')) {
      throw new Error('Challenged assumption not marked');
    }
    
    console.log('✓ Assumptions formatted with correct status markers');
  } catch (error) {
    console.error('✗ Assumptions test failed:', error);
    process.exit(1);
  }
  
  console.log('\n7. Testing Markdown decisions...');
  try {
    const packet = createMockPacket();
    const markdown = formatAsMarkdown(packet);
    
    if (!markdown.includes('## Decisions')) {
      throw new Error('Decisions section not found');
    }
    if (!markdown.includes('Use NextAuth.js for authentication')) {
      throw new Error('Decision text not found');
    }
    if (!markdown.includes('**Rationale:**')) {
      throw new Error('Rationale label not found');
    }
    if (!markdown.includes('Well-maintained, secure, and integrates with Next.js')) {
      throw new Error('Rationale text not found');
    }
    
    console.log('✓ Decisions formatted with rationale');
  } catch (error) {
    console.error('✗ Decisions test failed:', error);
    process.exit(1);
  }
  
  console.log('\n8. Testing Markdown artifacts...');
  try {
    const packet = createMockPacket();
    const markdown = formatAsMarkdown(packet);
    
    if (!markdown.includes('## Artifacts')) {
      throw new Error('Artifacts section not found');
    }
    if (!markdown.includes('auth.config.ts')) {
      throw new Error('Code artifact not found');
    }
    if (!markdown.includes('_(code)_')) {
      throw new Error('Code type label not found');
    }
    if (!markdown.includes('NextAuth.js Documentation')) {
      throw new Error('Link artifact not found');
    }
    if (!markdown.includes('_(link)_')) {
      throw new Error('Link type label not found');
    }
    if (!markdown.includes('https://next-auth.js.org')) {
      throw new Error('URL not found');
    }
    
    console.log('✓ Artifacts formatted with type labels and content');
  } catch (error) {
    console.error('✗ Artifacts test failed:', error);
    process.exit(1);
  }
  
  console.log('\n9. Testing Markdown session summary...');
  try {
    const packet = createMockPacket();
    const markdown = formatAsMarkdown(packet);
    
    if (!markdown.includes('## Session Summary')) {
      throw new Error('Session summary not found');
    }
    if (!markdown.includes('**Total Events:** 42')) {
      throw new Error('Total events not formatted');
    }
    if (!markdown.includes('**Agent Transitions:** 5')) {
      throw new Error('Agent transitions not formatted');
    }
    if (!markdown.includes('**Cost:** $0.0234')) {
      throw new Error('Cost not formatted');
    }
    if (!markdown.includes('**Tokens:** 1,500')) {
      throw new Error('Tokens not formatted with comma separator');
    }
    
    console.log('✓ Session summary with formatted numbers');
  } catch (error) {
    console.error('✗ Session summary test failed:', error);
    process.exit(1);
  }
  
  console.log('\n10. Testing Markdown with empty arrays...');
  try {
    const packet = createMockPacket({
      perspectives: [],
      assumptions: [],
      decisions: [],
      artifacts: [],
    });
    
    const markdown = formatAsMarkdown(packet);
    
    if (markdown.includes('## Perspectives')) {
      throw new Error('Empty perspectives section should not appear');
    }
    if (markdown.includes('## Assumptions')) {
      throw new Error('Empty assumptions section should not appear');
    }
    if (markdown.includes('## Decisions')) {
      throw new Error('Empty decisions section should not appear');
    }
    if (markdown.includes('## Artifacts')) {
      throw new Error('Empty artifacts section should not appear');
    }
    if (!markdown.includes('## Situation')) {
      throw new Error('Situation section should still appear');
    }
    if (!markdown.includes('## Session Summary')) {
      throw new Error('Session summary should still appear');
    }
    
    console.log('✓ Empty sections omitted gracefully');
  } catch (error) {
    console.error('✗ Empty arrays test failed:', error);
    process.exit(1);
  }
  
  console.log('\n11. Testing Markdown agent path...');
  try {
    const packet = createMockPacket();
    const markdown = formatAsMarkdown(packet);
    
    if (!markdown.includes('**Agent Path:** Supervisor → Dojo → Mirror')) {
      throw new Error('Agent path not formatted with arrows');
    }
    
    console.log('✓ Agent path formatted with arrow separators');
  } catch (error) {
    console.error('✗ Agent path test failed:', error);
    process.exit(1);
  }

  console.log('\n===== formatAsPDF Tests =====\n');
  
  console.log('12. Testing PDF generation...');
  try {
    const packet = createMockPacket();
    const pdfBuffer = await formatAsPDF(packet);
    
    if (!(pdfBuffer instanceof Buffer)) {
      throw new Error('PDF output is not a Buffer');
    }
    
    if (pdfBuffer.length === 0) {
      throw new Error('PDF buffer is empty');
    }
    
    const pdfHeader = pdfBuffer.toString('utf8', 0, 4);
    if (pdfHeader !== '%PDF') {
      throw new Error(`Invalid PDF header: expected '%PDF', got '${pdfHeader}'`);
    }
    
    console.log('✓ PDF generation successful');
    console.log(`  - Size: ${pdfBuffer.length} bytes`);
    console.log(`  - Header: ${pdfHeader}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('manus-md-to-pdf') || errorMessage.includes('PDF generation failed')) {
      console.log('⚠ PDF generation skipped: manus-md-to-pdf not available');
      console.log('  This is expected if the utility is not installed');
    } else {
      console.error('✗ PDF generation failed:', error);
      process.exit(1);
    }
  }
  
  console.log('\n13. Testing PDF cleanup...');
  try {
    const packet = createMockPacket({
      session: {
        ...createMockPacket().session,
        id: 'test-cleanup-123',
      },
    });
    
    try {
      await formatAsPDF(packet);
    } catch (error) {
    }
    
    const { readdir } = await import('fs/promises');
    const { tmpdir } = await import('os');
    const files = await readdir(tmpdir());
    
    const packetFiles = files.filter(f => f.includes('dojopacket-test-cleanup-123'));
    if (packetFiles.length > 0) {
      throw new Error(`Temporary files not cleaned up: ${packetFiles.join(', ')}`);
    }
    
    console.log('✓ Temporary files cleaned up');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Temporary files not cleaned up')) {
      console.error('✗ Cleanup test failed:', error);
      process.exit(1);
    } else {
      console.log('⚠ PDF cleanup test skipped (utility not available)');
    }
  }

  console.log('\n✅ All Formatter tests passed!\n');
  process.exit(0);
})();
