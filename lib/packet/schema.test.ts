import { DojoPacketSchema } from './schema';
import type { DojoPacket } from './schema';

(async () => {
  console.log('Testing DojoPacket Schema Validation...\n');

  const validPacket: DojoPacket = {
    version: '1.0',
    session: {
      id: 'test-session-123',
      title: 'Test Session',
      mode: 'Mirror',
      duration: 45,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      agent_path: ['Supervisor', 'Dojo'],
    },
    situation: 'Test situation',
    stake: 'Test stake',
    perspectives: [
      {
        text: 'Test perspective',
        source: 'user',
        timestamp: new Date().toISOString(),
      },
    ],
    assumptions: [
      {
        text: 'Test assumption',
        challenged: false,
        timestamp: new Date().toISOString(),
      },
    ],
    decisions: [
      {
        text: 'Test decision',
        rationale: 'Test rationale',
        timestamp: new Date().toISOString(),
      },
    ],
    next_move: {
      action: 'Test action',
      why: 'Test reason',
      smallest_test: 'Test smallest test',
    },
    artifacts: [
      {
        type: 'code',
        name: 'test.ts',
        content: 'console.log("test");',
        url: null,
      },
    ],
    trace_summary: {
      total_events: 10,
      agent_transitions: 2,
      cost_total: 0.05,
      tokens_total: 500,
    },
    metadata: {
      exported_at: new Date().toISOString(),
      exported_by: 'test-user',
      format: 'json',
    },
  };

  console.log('1. Testing valid packet...');
  try {
    const result = DojoPacketSchema.parse(validPacket);
    
    if (result.version !== '1.0') {
      throw new Error('Version validation failed');
    }
    
    console.log('✓ Valid packet passes schema validation');
  } catch (error) {
    console.error('✗ Valid packet failed validation:', error);
    process.exit(1);
  }

  console.log('\n2. Testing invalid version...');
  try {
    const invalidVersion = { ...validPacket, version: '2.0' };
    DojoPacketSchema.parse(invalidVersion);
    console.error('✗ Should have rejected invalid version');
    process.exit(1);
  } catch (error) {
    console.log('✓ Invalid version rejected correctly');
  }

  console.log('\n3. Testing invalid mode...');
  try {
    const invalidMode = {
      ...validPacket,
      session: { ...validPacket.session, mode: 'InvalidMode' },
    };
    DojoPacketSchema.parse(invalidMode as any);
    console.error('✗ Should have rejected invalid mode');
    process.exit(1);
  } catch (error) {
    console.log('✓ Invalid mode rejected correctly');
  }

  console.log('\n4. Testing invalid perspective source...');
  try {
    const invalidSource = {
      ...validPacket,
      perspectives: [
        {
          text: 'Test',
          source: 'invalid',
          timestamp: new Date().toISOString(),
        },
      ],
    };
    DojoPacketSchema.parse(invalidSource as any);
    console.error('✗ Should have rejected invalid perspective source');
    process.exit(1);
  } catch (error) {
    console.log('✓ Invalid perspective source rejected correctly');
  }

  console.log('\n5. Testing invalid artifact type...');
  try {
    const invalidArtifact = {
      ...validPacket,
      artifacts: [
        {
          type: 'invalid',
          name: 'test',
          content: null,
          url: null,
        },
      ],
    };
    DojoPacketSchema.parse(invalidArtifact as any);
    console.error('✗ Should have rejected invalid artifact type');
    process.exit(1);
  } catch (error) {
    console.log('✓ Invalid artifact type rejected correctly');
  }

  console.log('\n6. Testing null optional fields...');
  try {
    const nullFields = {
      ...validPacket,
      stake: null,
      next_move: {
        action: 'Test',
        why: 'Test',
        smallest_test: null,
      },
    };
    const result = DojoPacketSchema.parse(nullFields);
    
    if (result.stake !== null) {
      throw new Error('Null stake not preserved');
    }
    if (result.next_move.smallest_test !== null) {
      throw new Error('Null smallest_test not preserved');
    }
    
    console.log('✓ Null optional fields validated correctly');
  } catch (error) {
    console.error('✗ Null fields validation failed:', error);
    process.exit(1);
  }

  console.log('\n7. Testing empty arrays...');
  try {
    const emptyArrays = {
      ...validPacket,
      perspectives: [],
      assumptions: [],
      decisions: [],
      artifacts: [],
    };
    const result = DojoPacketSchema.parse(emptyArrays);
    
    if (result.perspectives.length !== 0 ||
        result.assumptions.length !== 0 ||
        result.decisions.length !== 0 ||
        result.artifacts.length !== 0) {
      throw new Error('Empty arrays not preserved');
    }
    
    console.log('✓ Empty arrays validated correctly');
  } catch (error) {
    console.error('✗ Empty arrays validation failed:', error);
    process.exit(1);
  }

  console.log('\n8. Testing missing required fields...');
  try {
    const missingField = {
      ...validPacket,
      session: { ...validPacket.session, id: undefined },
    };
    DojoPacketSchema.parse(missingField as any);
    console.error('✗ Should have rejected missing session ID');
    process.exit(1);
  } catch (error) {
    console.log('✓ Missing required fields rejected correctly');
  }

  console.log('\n9. Testing invalid format enum...');
  try {
    const invalidFormat = {
      ...validPacket,
      metadata: { ...validPacket.metadata, format: 'xml' },
    };
    DojoPacketSchema.parse(invalidFormat as any);
    console.error('✗ Should have rejected invalid format enum');
    process.exit(1);
  } catch (error) {
    console.log('✓ Invalid format enum rejected correctly');
  }

  console.log('\n10. Testing all valid modes...');
  try {
    const modes: Array<'Mirror' | 'Scout' | 'Gardener' | 'Implementation'> = [
      'Mirror',
      'Scout',
      'Gardener',
      'Implementation',
    ];
    
    for (const mode of modes) {
      const packet = {
        ...validPacket,
        session: { ...validPacket.session, mode },
      };
      const result = DojoPacketSchema.parse(packet);
      if (result.session.mode !== mode) {
        throw new Error(`Mode ${mode} validation failed`);
      }
    }
    
    console.log('✓ All valid modes accepted');
    console.log('  - Mirror, Scout, Gardener, Implementation');
  } catch (error) {
    console.error('✗ Valid modes test failed:', error);
    process.exit(1);
  }

  console.log('\n11. Testing all valid formats...');
  try {
    const formats: Array<'json' | 'markdown' | 'pdf'> = ['json', 'markdown', 'pdf'];
    
    for (const format of formats) {
      const packet = {
        ...validPacket,
        metadata: { ...validPacket.metadata, format },
      };
      const result = DojoPacketSchema.parse(packet);
      if (result.metadata.format !== format) {
        throw new Error(`Format ${format} validation failed`);
      }
    }
    
    console.log('✓ All valid formats accepted');
    console.log('  - json, markdown, pdf');
  } catch (error) {
    console.error('✗ Valid formats test failed:', error);
    process.exit(1);
  }

  console.log('\n12. Testing all valid artifact types...');
  try {
    const types: Array<'file' | 'link' | 'code' | 'image'> = ['file', 'link', 'code', 'image'];
    
    for (const type of types) {
      const packet = {
        ...validPacket,
        artifacts: [
          {
            type,
            name: 'test',
            content: type === 'link' ? null : 'content',
            url: type === 'link' ? 'https://example.com' : null,
          },
        ],
      };
      const result = DojoPacketSchema.parse(packet);
      if (result.artifacts[0].type !== type) {
        throw new Error(`Artifact type ${type} validation failed`);
      }
    }
    
    console.log('✓ All valid artifact types accepted');
    console.log('  - file, link, code, image');
  } catch (error) {
    console.error('✗ Valid artifact types test failed:', error);
    process.exit(1);
  }

  console.log('\n✅ All Schema Validation tests passed!\n');
  process.exit(0);
})();
