import {
  loadAgentRegistry,
  reloadAgentRegistry,
  getAvailableAgents,
  getAgentById,
  getDefaultAgent,
  isValidAgentId,
  validateAgentRegistry,
  routeQuery,
} from '../../lib/agents/supervisor';
import { AGENT_IDS, RoutingContext } from '../../lib/agents/types';

console.log('Testing Agent Registry...\n');

console.log('1. Testing loadAgentRegistry()...');
try {
  const registry = loadAgentRegistry();
  console.log(`✓ Registry loaded successfully with ${registry.agents.length} agents`);
} catch (error) {
  console.error('✗ Failed to load registry:', error);
  process.exit(1);
}

console.log('\n2. Testing getAvailableAgents()...');
try {
  const agents = getAvailableAgents();
  console.log(`✓ Found ${agents.length} available agents:`);
  agents.forEach((agent) => {
    console.log(`  - ${agent.name} (${agent.id})${agent.default ? ' [DEFAULT]' : ''}`);
  });
} catch (error) {
  console.error('✗ Failed to get available agents:', error);
  process.exit(1);
}

console.log('\n3. Testing getDefaultAgent()...');
try {
  const defaultAgent = getDefaultAgent();
  console.log(`✓ Default agent: ${defaultAgent.name} (${defaultAgent.id})`);
  
  if (defaultAgent.id !== AGENT_IDS.DOJO) {
    console.error(`✗ Expected default agent to be ${AGENT_IDS.DOJO}, got ${defaultAgent.id}`);
    process.exit(1);
  }
} catch (error) {
  console.error('✗ Failed to get default agent:', error);
  process.exit(1);
}

console.log('\n4. Testing getAgentById()...');
try {
  const dojoAgent = getAgentById(AGENT_IDS.DOJO);
  console.log(`✓ Dojo Agent: ${dojoAgent.name}`);
  
  const librarianAgent = getAgentById(AGENT_IDS.LIBRARIAN);
  console.log(`✓ Librarian Agent: ${librarianAgent.name}`);
  
  const debuggerAgent = getAgentById(AGENT_IDS.DEBUGGER);
  console.log(`✓ Debugger Agent: ${debuggerAgent.name}`);
} catch (error) {
  console.error('✗ Failed to get agent by ID:', error);
  process.exit(1);
}

console.log('\n5. Testing isValidAgentId()...');
try {
  if (!isValidAgentId(AGENT_IDS.DOJO)) {
    console.error('✗ Expected dojo to be a valid agent ID');
    process.exit(1);
  }
  console.log(`✓ '${AGENT_IDS.DOJO}' is valid`);
  
  if (!isValidAgentId(AGENT_IDS.LIBRARIAN)) {
    console.error('✗ Expected librarian to be a valid agent ID');
    process.exit(1);
  }
  console.log(`✓ '${AGENT_IDS.LIBRARIAN}' is valid`);
  
  if (!isValidAgentId(AGENT_IDS.DEBUGGER)) {
    console.error('✗ Expected debugger to be a valid agent ID');
    process.exit(1);
  }
  console.log(`✓ '${AGENT_IDS.DEBUGGER}' is valid`);
  
  if (isValidAgentId('invalid_agent')) {
    console.error('✗ Expected invalid_agent to be invalid');
    process.exit(1);
  }
  console.log(`✓ 'invalid_agent' is correctly invalid`);
} catch (error) {
  console.error('✗ Failed to validate agent IDs:', error);
  process.exit(1);
}

console.log('\n6. Testing validateAgentRegistry()...');
try {
  const validation = validateAgentRegistry();
  
  if (!validation.valid) {
    console.error('✗ Registry validation failed:');
    validation.errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }
  
  console.log('✓ Registry validation passed');
} catch (error) {
  console.error('✗ Failed to validate registry:', error);
  process.exit(1);
}

console.log('\n7. Testing reloadAgentRegistry()...');
try {
  const reloadedRegistry = reloadAgentRegistry();
  console.log(`✓ Registry reloaded successfully with ${reloadedRegistry.agents.length} agents`);
} catch (error) {
  console.error('✗ Failed to reload registry:', error);
  process.exit(1);
}

console.log('\n8. Testing agent structure...');
try {
  const agents = getAvailableAgents();
  
  for (const agent of agents) {
    if (!agent.id || !agent.name || !agent.description) {
      console.error(`✗ Agent ${agent.id} is missing required fields`);
      process.exit(1);
    }
    
    if (!Array.isArray(agent.when_to_use) || agent.when_to_use.length === 0) {
      console.error(`✗ Agent ${agent.id} has invalid when_to_use`);
      process.exit(1);
    }
    
    if (!Array.isArray(agent.when_not_to_use) || agent.when_not_to_use.length === 0) {
      console.error(`✗ Agent ${agent.id} has invalid when_not_to_use`);
      process.exit(1);
    }
    
    console.log(`✓ Agent ${agent.id} structure is valid`);
  }
} catch (error) {
  console.error('✗ Failed to validate agent structure:', error);
  process.exit(1);
}

console.log('\n9. Testing routeQuery() with keyword fallback...');
(async () => {
  try {
    const testCases: { query: string; expectedAgent: string; description: string }[] = [
      {
        query: 'Find prompts similar to my budget planning prompt',
        expectedAgent: AGENT_IDS.LIBRARIAN,
        description: 'Search query (contains "find" keyword)',
      },
      {
        query: 'Search for previous conversations about design',
        expectedAgent: AGENT_IDS.LIBRARIAN,
        description: 'Search query (contains "search" keyword)',
      },
      {
        query: 'I have conflicting perspectives on this approach',
        expectedAgent: AGENT_IDS.DEBUGGER,
        description: 'Debug query (contains "conflict" keyword)',
      },
      {
        query: 'Something is wrong with my reasoning',
        expectedAgent: AGENT_IDS.DEBUGGER,
        description: 'Debug query (contains "wrong" keyword)',
      },
      {
        query: 'Help me explore different perspectives on this idea',
        expectedAgent: AGENT_IDS.DOJO,
        description: 'Thinking query (default agent)',
      },
      {
        query: 'What are the tradeoffs between approach A and B?',
        expectedAgent: AGENT_IDS.DOJO,
        description: 'Thinking query (default agent)',
      },
    ];

    const availableAgents = getAvailableAgents();

    for (const testCase of testCases) {
      const context: RoutingContext = {
        query: testCase.query,
        conversation_context: [],
        session_id: 'test-session',
        available_agents: availableAgents,
      };

      const decision = await routeQuery(context);

      if (decision.agent_id === testCase.expectedAgent) {
        console.log(`✓ ${testCase.description}`);
        console.log(`  Query: "${testCase.query}"`);
        console.log(`  Routed to: ${decision.agent_name} (confidence: ${decision.confidence})`);
        console.log(`  Reasoning: ${decision.reasoning}`);
      } else {
        console.error(`✗ ${testCase.description}`);
        console.error(`  Query: "${testCase.query}"`);
        console.error(`  Expected: ${testCase.expectedAgent}, Got: ${decision.agent_id}`);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('✗ Routing tests failed:', error);
    process.exit(1);
  }

  console.log('\n10. Testing empty query handling...');
  try {
    const context: RoutingContext = {
      query: '',
      conversation_context: [],
      session_id: 'test-session',
      available_agents: getAvailableAgents(),
    };

    const decision = await routeQuery(context);

    if (decision.agent_id === AGENT_IDS.DOJO && decision.fallback === true) {
      console.log('✓ Empty query correctly routed to default agent');
      console.log(`  Reasoning: ${decision.reasoning}`);
    } else {
      console.error('✗ Empty query not handled correctly');
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Empty query test failed:', error);
    process.exit(1);
  }

  console.log('\n11. Testing no agents available...');
  try {
    const context: RoutingContext = {
      query: 'test query',
      conversation_context: [],
      session_id: 'test-session',
      available_agents: [],
    };

    await routeQuery(context);
    console.error('✗ Should have thrown error for no agents');
    process.exit(1);
  } catch (error) {
    if (error instanceof Error && error.message.includes('No agents available')) {
      console.log('✓ Correctly throws error when no agents available');
    } else {
      console.error('✗ Wrong error thrown:', error);
      process.exit(1);
    }
  }

  console.log('\n12. Testing conversation context...');
  try {
    const context: RoutingContext = {
      query: 'What did we discuss?',
      conversation_context: [
        'User: I want to find similar prompts',
        'Assistant: Let me search for you',
        'User: What did we discuss?',
      ],
      session_id: 'test-session',
      available_agents: getAvailableAgents(),
    };

    const decision = await routeQuery(context);
    console.log('✓ Routing with conversation context works');
    console.log(`  Routed to: ${decision.agent_name}`);
    console.log(`  Reasoning: ${decision.reasoning}`);
  } catch (error) {
    console.error('✗ Conversation context test failed:', error);
    process.exit(1);
  }

  console.log('\n✅ All routing tests passed!\n');
  console.log('\n✅ All tests passed!\n');
})();
