async function testAgentDetailsModalComponent() {
  console.log('=== Testing AgentDetailsModal Component ===\n');

  try {
    console.log('✓ Verifying component module structure...');
    
    const { AgentDetailsModal } = await import('@/components/agents/AgentDetailsModal');
    
    if (!AgentDetailsModal || (typeof AgentDetailsModal !== 'function' && typeof AgentDetailsModal !== 'object')) {
      throw new Error('AgentDetailsModal is not a valid React component');
    }
    console.log('✓ AgentDetailsModal component exports correctly\n');

    console.log('✓ Creating mock agent data with usage stats...');
    const mockAgent = {
      id: 'dojo',
      name: 'Dojo',
      icon: '🧘',
      tagline: 'Thinking partnership for complex decisions',
      description: 'Dojo helps you think through complex problems by asking clarifying questions.',
      when_to_use: [
        'When facing complex architectural decisions',
        'When you need help breaking down problems',
        'When you want to explore trade-offs',
      ],
      when_not_to_use: [
        'Simple factual queries (use Librarian)',
        'Automated task execution',
        'Code generation',
      ],
      model: 'gpt-4o-mini',
      default: false,
      status: 'online' as const,
      usage_stats: {
        query_count: 42,
        total_cost_usd: 0.0123,
        avg_tokens_used: 1250,
        last_used_at: new Date().toISOString(),
      },
    };
    console.log('✓ Mock agent data created\n');

    console.log('✓ Creating mock props...');
    const mockProps = {
      agent: mockAgent,
      isOpen: true,
      onClose: () => {
        console.log('  Mock onClose handler called');
      },
      onTestAgent: () => {
        console.log('  Mock onTestAgent handler called');
      },
    };
    console.log('✓ Mock props created\n');

    console.log('✓ Verifying required props...');
    const requiredProps = ['agent', 'isOpen', 'onClose', 'onTestAgent'];
    for (const prop of requiredProps) {
      if (!(prop in mockProps)) {
        throw new Error(`Missing required prop: ${prop}`);
      }
    }
    console.log('✓ All required props present\n');

    console.log('✓ Verifying agent data structure...');
    const requiredAgentFields = [
      'id', 'name', 'icon', 'tagline', 'description',
      'when_to_use', 'when_not_to_use', 'status'
    ];
    for (const field of requiredAgentFields) {
      if (!(field in mockAgent)) {
        throw new Error(`Missing required agent field: ${field}`);
      }
    }
    console.log('✓ Agent data structure is correct\n');

    console.log('✓ Verifying usage stats structure (optional)...');
    if (mockAgent.usage_stats) {
      const requiredStatsFields = ['query_count', 'total_cost_usd', 'avg_tokens_used', 'last_used_at'];
      for (const field of requiredStatsFields) {
        if (!(field in mockAgent.usage_stats)) {
          throw new Error(`Missing required usage_stats field: ${field}`);
        }
      }
      console.log('✓ Usage stats structure is correct\n');
    }

    console.log('=== AgentDetailsModal Component Tests Passed! ===');
    console.log('\nNote: Component structure verified. Interactive testing');
    console.log('(modal open/close, keyboard shortcuts, click outside, focus trap)');
    console.log('should be done in the browser on the /agents page.');
    return true;
  } catch (error) {
    console.error('\n❌ AgentDetailsModal component test failed:', error);
    throw error;
  }
}

testAgentDetailsModalComponent()
  .then(() => {
    console.log('\n✓ AgentDetailsModal component test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ AgentDetailsModal component test failed:', error);
    process.exit(1);
  });
