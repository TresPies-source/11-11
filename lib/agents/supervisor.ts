import { z } from 'zod';
import registryData from './registry.json';
import {
  Agent,
  AgentRegistry,
  AgentNotFoundError,
  RoutingDecision,
  RoutingContext,
  RoutingError,
  AGENT_IDS,
  type AgentId,
} from './types';
import { createJSONCompletion, canUseOpenAI } from '../openai/client';
import {
  DEFAULT_ROUTING_MODEL,
  DEFAULT_ROUTING_TIMEOUT,
  DEFAULT_ROUTING_TEMPERATURE,
  GPT_4O_MINI_PRICING,
} from '../openai/types';
import { getDB } from '../pglite/client';

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

const CONFIDENCE_THRESHOLD = 0.6;

function buildRoutingPrompt(
  userQuery: string,
  conversationContext: string[],
  availableAgents: Agent[]
): string {
  const agentDescriptions = availableAgents
    .map(
      (agent) => `
**${agent.name}** (id: ${agent.id})
Description: ${agent.description}

When to use:
${agent.when_to_use.map((item) => `  - ${item}`).join('\n')}

When NOT to use:
${agent.when_not_to_use.map((item) => `  - ${item}`).join('\n')}
`
    )
    .join('\n---\n');

  const contextSection =
    conversationContext.length > 0
      ? `
Conversation context (last ${conversationContext.length} messages):
${conversationContext.join('\n')}
`
      : '';

  return `You are the Supervisor Router for the Dojo Genesis system.

Your job is to read the user's query and conversation context, then select the best agent to handle it.

Available agents:
${agentDescriptions}

User query: "${userQuery}"
${contextSection}

Select the best agent and explain why in 1-2 sentences.

Respond in JSON format:
{
  "agent_id": "dojo|librarian|debugger",
  "confidence": 0.0-1.0,
  "reasoning": "1-2 sentence explanation"
}`;
}

const RoutingResponseSchema = z.object({
  agent_id: z.string().min(1),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1),
});

async function routeQueryWithLLM(
  userQuery: string,
  conversationContext: string[],
  availableAgents: Agent[]
): Promise<RoutingDecision> {
  const prompt = buildRoutingPrompt(userQuery, conversationContext, availableAgents);

  try {
    const { data, usage } = await createJSONCompletion(
      [{ role: 'user', content: prompt }],
      {
        model: DEFAULT_ROUTING_MODEL,
        temperature: DEFAULT_ROUTING_TEMPERATURE,
        timeout: DEFAULT_ROUTING_TIMEOUT,
      }
    );

    const validated = RoutingResponseSchema.parse(data);

    const selectedAgent = availableAgents.find((a) => a.id === validated.agent_id);
    if (!selectedAgent) {
      throw new RoutingError(
        `Selected agent '${validated.agent_id}' not found in available agents`
      );
    }

    return {
      agent_id: validated.agent_id,
      agent_name: selectedAgent.name,
      confidence: validated.confidence,
      reasoning: validated.reasoning,
      fallback: false,
    };
  } catch (error) {
    throw new RoutingError(
      `LLM routing failed: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}

function routeQueryKeywordFallback(
  userQuery: string,
  availableAgents: Agent[]
): RoutingDecision {
  const queryLower = userQuery.toLowerCase();

  const searchKeywords = ['search', 'find', 'lookup', 'retrieve', 'discover', 'similar'];
  const debugKeywords = ['conflict', 'error', 'wrong', 'debug', 'fix', 'validate'];

  const hasSearchKeyword = searchKeywords.some((kw) => queryLower.includes(kw));
  const hasDebugKeyword = debugKeywords.some((kw) => queryLower.includes(kw));

  let selectedAgentId: string = AGENT_IDS.DOJO;
  let reasoning = 'Default agent (keyword-based fallback)';

  if (hasSearchKeyword) {
    selectedAgentId = AGENT_IDS.LIBRARIAN;
    reasoning = 'Query contains search-related keywords';
  } else if (hasDebugKeyword) {
    selectedAgentId = AGENT_IDS.DEBUGGER;
    reasoning = 'Query contains debug/conflict-related keywords';
  }

  const selectedAgent = availableAgents.find((a) => a.id === selectedAgentId);

  return {
    agent_id: selectedAgentId,
    agent_name: selectedAgent?.name || 'Unknown Agent',
    confidence: 0.5,
    reasoning: `${reasoning} (dev mode - no API key)`,
    fallback: true,
  };
}

export async function routeQuery(
  context: RoutingContext
): Promise<RoutingDecision> {
  const { query, conversation_context, available_agents } = context;

  if (available_agents.length === 0) {
    throw new RoutingError('No agents available for routing');
  }

  if (!query || query.trim().length === 0) {
    const defaultAgent = getDefaultAgent();
    return {
      agent_id: defaultAgent.id,
      agent_name: defaultAgent.name,
      confidence: 1.0,
      reasoning: 'Empty query - routing to default agent',
      fallback: true,
    };
  }

  if (!canUseOpenAI()) {
    console.log('[Routing] Using keyword-based fallback (no API key)');
    return routeQueryKeywordFallback(query, available_agents);
  }

  try {
    const decision = await routeQueryWithLLM(
      query,
      conversation_context,
      available_agents
    );

    if (decision.confidence < CONFIDENCE_THRESHOLD) {
      const defaultAgent = getDefaultAgent();
      return {
        agent_id: defaultAgent.id,
        agent_name: defaultAgent.name,
        confidence: decision.confidence,
        reasoning: `Low confidence (${decision.confidence.toFixed(2)}). Falling back to ${defaultAgent.name}.`,
        fallback: true,
      };
    }

    return decision;
  } catch (error) {
    console.error('[Routing] LLM routing failed:', error);
    const defaultAgent = getDefaultAgent();
    return {
      agent_id: defaultAgent.id,
      agent_name: defaultAgent.name,
      confidence: 0.0,
      reasoning: `Routing error: ${error instanceof Error ? error.message : String(error)}. Falling back to ${defaultAgent.name}.`,
      fallback: true,
    };
  }
}

export async function saveRoutingDecision(
  decision: RoutingDecision,
  context: RoutingContext,
  tokensUsed?: number
): Promise<{ routing_decision_id: string; routing_cost_id?: string }> {
  const db = await getDB();

  const routingDecisionResult = await db.query<{ id: string }>(
    `
    INSERT INTO routing_decisions (
      session_id,
      user_query,
      agent_selected,
      confidence,
      reasoning,
      is_fallback,
      conversation_context
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `,
    [
      context.session_id,
      context.query,
      decision.agent_id,
      decision.confidence,
      decision.reasoning,
      decision.fallback || false,
      JSON.stringify(context.conversation_context),
    ]
  );

  const routing_decision_id = routingDecisionResult.rows[0].id;

  if (tokensUsed !== undefined && tokensUsed > 0) {
    const costUsd =
      tokensUsed *
      (GPT_4O_MINI_PRICING.input + GPT_4O_MINI_PRICING.output) /
      2;

    const routingCostResult = await db.query<{ id: string }>(
      `
      INSERT INTO routing_costs (
        routing_decision_id,
        session_id,
        tokens_used,
        cost_usd,
        model
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
      [
        routing_decision_id,
        context.session_id,
        tokensUsed,
        costUsd,
        DEFAULT_ROUTING_MODEL,
      ]
    );

    return {
      routing_decision_id,
      routing_cost_id: routingCostResult.rows[0].id,
    };
  }

  return { routing_decision_id };
}
