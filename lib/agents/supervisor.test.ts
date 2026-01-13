import {
  loadAgentRegistry,
  reloadAgentRegistry,
  getAvailableAgents,
  getAgentById,
  getDefaultAgent,
  isValidAgentId,
  validateAgentRegistry,
} from './supervisor';
import { AGENT_IDS } from './types';

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

console.log('\n✅ All tests passed!\n');
