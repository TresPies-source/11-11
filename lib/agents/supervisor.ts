import { z } from 'zod';
import registryData from './registry.json';
import {
  Agent,
  AgentRegistry,
  AgentNotFoundError,
  AGENT_IDS,
  type AgentId,
} from './types';

const AgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  when_to_use: z.array(z.string()).min(1),
  when_not_to_use: z.array(z.string()).min(1),
  default: z.boolean(),
});

const AgentRegistrySchema = z.object({
  agents: z.array(AgentSchema).min(1),
});

let cachedRegistry: AgentRegistry | null = null;
let registryLoadError: Error | null = null;

export function loadAgentRegistry(): AgentRegistry {
  if (cachedRegistry) {
    return cachedRegistry;
  }

  if (registryLoadError) {
    throw registryLoadError;
  }

  try {
    const validatedRegistry = AgentRegistrySchema.parse(registryData);

    const defaultAgents = validatedRegistry.agents.filter((a) => a.default);
    if (defaultAgents.length !== 1) {
      throw new Error(
        `Registry must have exactly one default agent, found ${defaultAgents.length}`
      );
    }

    const agentIds = new Set<string>();
    for (const agent of validatedRegistry.agents) {
      if (agentIds.has(agent.id)) {
        throw new Error(`Duplicate agent ID found: ${agent.id}`);
      }
      agentIds.add(agent.id);
    }

    cachedRegistry = validatedRegistry;
    return cachedRegistry;
  } catch (error) {
    registryLoadError = error instanceof Error ? error : new Error(String(error));
    throw registryLoadError;
  }
}

export function reloadAgentRegistry(): AgentRegistry {
  cachedRegistry = null;
  registryLoadError = null;
  return loadAgentRegistry();
}

export function getAvailableAgents(): Agent[] {
  const registry = loadAgentRegistry();
  return registry.agents;
}

export function getAgentById(agentId: string): Agent {
  const registry = loadAgentRegistry();
  const agent = registry.agents.find((a) => a.id === agentId);
  
  if (!agent) {
    throw new AgentNotFoundError(agentId);
  }
  
  return agent;
}

export function getDefaultAgent(): Agent {
  const registry = loadAgentRegistry();
  const defaultAgent = registry.agents.find((a) => a.default);
  
  if (!defaultAgent) {
    throw new Error('No default agent found in registry');
  }
  
  return defaultAgent;
}

export function isValidAgentId(agentId: string): boolean {
  try {
    getAgentById(agentId);
    return true;
  } catch (error) {
    if (error instanceof AgentNotFoundError) {
      return false;
    }
    throw error;
  }
}

export function validateAgentRegistry(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    const registry = loadAgentRegistry();

    if (registry.agents.length === 0) {
      errors.push('Registry has no agents');
    }

    const defaultAgents = registry.agents.filter((a) => a.default);
    if (defaultAgents.length === 0) {
      errors.push('Registry has no default agent');
    } else if (defaultAgents.length > 1) {
      errors.push(`Registry has ${defaultAgents.length} default agents (expected 1)`);
    }

    const agentIds = new Set<string>();
    for (const agent of registry.agents) {
      if (agentIds.has(agent.id)) {
        errors.push(`Duplicate agent ID: ${agent.id}`);
      }
      agentIds.add(agent.id);

      if (agent.when_to_use.length === 0) {
        errors.push(`Agent ${agent.id} has no "when_to_use" criteria`);
      }

      if (agent.when_not_to_use.length === 0) {
        errors.push(`Agent ${agent.id} has no "when_not_to_use" criteria`);
      }
    }

    const expectedAgentIds = Object.values(AGENT_IDS);
    for (const expectedId of expectedAgentIds) {
      if (!agentIds.has(expectedId)) {
        errors.push(`Missing expected agent: ${expectedId}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    errors.push(
      `Registry validation failed: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      valid: false,
      errors,
    };
  }
}
