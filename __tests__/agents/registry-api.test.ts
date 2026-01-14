import { loadAgentRegistry } from '../../lib/agents/supervisor';
import { getAgentStatus } from '../../lib/agents/status';

console.log('Testing Agent Registry API...\n');

let testCount = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, message?: string): void {
  testCount++;
  if (condition) {
    passedTests++;
    console.log(`✓ ${testName}`);
  } else {
    console.error(`✗ ${testName}`);
    if (message) {
      console.error(`  ${message}`);
    }
  }
}

async function testLoadAgentRegistry(): Promise<void> {
  console.log('\nTesting loadAgentRegistry()');

  const registry = loadAgentRegistry();
  
  assert(
    typeof registry === 'object',
    'Registry is an object'
  );

  assert(
    Array.isArray(registry.agents),
    'Registry.agents is an array'
  );

  assert(
    registry.agents.length >= 3,
    `Registry has at least 3 agents (got ${registry.agents.length})`
  );

  const requiredFields = ['id', 'name', 'icon', 'tagline', 'description', 'when_to_use', 'when_not_to_use'];
  
  for (const agent of registry.agents) {
    for (const field of requiredFields) {
      assert(
        field in agent,
        `Agent ${agent.id} has field: ${field}`
      );
    }

    assert(
      typeof agent.icon === 'string' && agent.icon.length > 0,
      `Agent ${agent.id} has valid icon`
    );

    assert(
      typeof agent.tagline === 'string' && agent.tagline.length > 0,
      `Agent ${agent.id} has valid tagline`
    );

    assert(
      Array.isArray(agent.when_to_use),
      `Agent ${agent.id} when_to_use is an array`
    );

    assert(
      Array.isArray(agent.when_not_to_use),
      `Agent ${agent.id} when_not_to_use is an array`
    );
  }
}

async function testAgentStatus(): Promise<void> {
  console.log('\nTesting getAgentStatus()');

  const registry = loadAgentRegistry();
  
  for (const agent of registry.agents) {
    const status = getAgentStatus(agent.id);
    
    assert(
      status === 'online' || status === 'offline',
      `Agent ${agent.id} has valid status: ${status}`
    );
  }

  const invalidStatus = getAgentStatus('non-existent-agent');
  assert(
    invalidStatus === 'offline',
    'Non-existent agent returns offline status'
  );
}

async function testRegistryAPIShape(): Promise<void> {
  console.log('\nTesting registry API response shape');

  const registry = loadAgentRegistry();
  
  const apiResponse = {
    agents: registry.agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      icon: agent.icon,
      tagline: agent.tagline,
      description: agent.description,
      when_to_use: agent.when_to_use,
      when_not_to_use: agent.when_not_to_use,
      status: getAgentStatus(agent.id),
    })),
  };

  assert(
    Array.isArray(apiResponse.agents),
    'API response has agents array'
  );

  assert(
    apiResponse.agents.length === registry.agents.length,
    `API response has all agents (${apiResponse.agents.length})`
  );

  for (const agent of apiResponse.agents) {
    assert(
      'status' in agent,
      `Agent ${agent.id} in API response has status field`
    );
  }

  console.log('\n  Sample API response shape:');
  console.log(JSON.stringify(apiResponse.agents[0], null, 2));
}

async function runAllTests(): Promise<void> {
  try {
    await testLoadAgentRegistry();
    await testAgentStatus();
    await testRegistryAPIShape();

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Tests passed: ${passedTests}/${testCount}`);
    console.log(`${'='.repeat(50)}\n`);

    if (passedTests === testCount) {
      console.log('✓ All registry API tests passed!');
      process.exit(0);
    } else {
      console.error('✗ Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Test suite error:', error);
    process.exit(1);
  }
}

runAllTests();
