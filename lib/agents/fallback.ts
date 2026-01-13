import {
  RoutingContext,
  RoutingDecision,
  RoutingDecisionWithUsage,
  RoutingError,
  AgentNotFoundError,
} from './types';
import { routeQuery, getDefaultAgent, getAgentById, getAvailableAgents } from './supervisor';
import { OpenAITimeoutError, OpenAIRateLimitError, OpenAIAuthError } from '../openai/types';

/**
 * Fallback reasons enum for better categorization and logging
 */
export enum FallbackReason {
  LOW_CONFIDENCE = 'low_confidence',
  TIMEOUT = 'timeout',
  API_ERROR = 'api_error',
  RATE_LIMIT = 'rate_limit',
  AGENT_UNAVAILABLE = 'agent_unavailable',
  REGISTRY_ERROR = 'registry_error',
  UNKNOWN_ERROR = 'unknown_error',
  EMPTY_QUERY = 'empty_query',
  NO_API_KEY = 'no_api_key',
}

/**
 * Fallback event for logging and observability
 */
export interface FallbackEvent {
  reason: FallbackReason;
  error_message?: string;
  fallback_agent_id: string;
  fallback_agent_name: string;
  original_confidence?: number;
  timestamp: string;
  session_id: string;
  query: string;
}

/**
 * Log a fallback event (to console for now, Harness Trace integration later)
 */
function logFallbackEvent(event: FallbackEvent): void {
  console.warn('[ROUTING_FALLBACK]', {
    reason: event.reason,
    error: event.error_message,
    fallback_to: `${event.fallback_agent_name} (${event.fallback_agent_id})`,
    confidence: event.original_confidence,
    session_id: event.session_id,
    timestamp: event.timestamp,
  });
}

/**
 * Create a fallback decision using the default agent
 */
function createFallbackDecision(
  reason: FallbackReason,
  errorMessage?: string,
  confidence: number = 0.0
): RoutingDecision {
  const defaultAgent = getDefaultAgent();
  
  let reasoning = '';
  switch (reason) {
    case FallbackReason.LOW_CONFIDENCE:
      reasoning = `Low confidence (${confidence.toFixed(2)}). Falling back to ${defaultAgent.name}.`;
      break;
    case FallbackReason.TIMEOUT:
      reasoning = `Routing timed out after 5 seconds. Falling back to ${defaultAgent.name}.`;
      break;
    case FallbackReason.API_ERROR:
      reasoning = `API error: ${errorMessage}. Falling back to ${defaultAgent.name}.`;
      break;
    case FallbackReason.RATE_LIMIT:
      reasoning = `Rate limit exceeded. Falling back to ${defaultAgent.name}.`;
      break;
    case FallbackReason.AGENT_UNAVAILABLE:
      reasoning = `Selected agent unavailable: ${errorMessage}. Falling back to ${defaultAgent.name}.`;
      break;
    case FallbackReason.REGISTRY_ERROR:
      reasoning = `Registry error: ${errorMessage}. Falling back to ${defaultAgent.name}.`;
      break;
    case FallbackReason.EMPTY_QUERY:
      reasoning = `Empty query. Routing to ${defaultAgent.name}.`;
      break;
    case FallbackReason.NO_API_KEY:
      reasoning = `No API key configured. Using keyword-based routing to ${defaultAgent.name}.`;
      break;
    case FallbackReason.UNKNOWN_ERROR:
    default:
      reasoning = `Unexpected error: ${errorMessage}. Falling back to ${defaultAgent.name}.`;
      break;
  }

  return {
    agent_id: defaultAgent.id,
    agent_name: defaultAgent.name,
    confidence,
    reasoning,
    fallback: true,
  };
}

/**
 * Validate that a selected agent is available in the registry
 * If not, return a fallback decision
 */
function validateAgentAvailability(
  decision: RoutingDecision,
  context: RoutingContext
): RoutingDecision {
  try {
    // Check if agent exists in registry
    getAgentById(decision.agent_id);
    
    // Check if agent is in the available agents list
    const isAvailable = context.available_agents.some(
      (agent) => agent.id === decision.agent_id
    );
    
    if (!isAvailable) {
      const fallbackDecision = createFallbackDecision(
        FallbackReason.AGENT_UNAVAILABLE,
        decision.agent_id,
        decision.confidence
      );
      
      logFallbackEvent({
        reason: FallbackReason.AGENT_UNAVAILABLE,
        error_message: `Agent ${decision.agent_id} not in available agents list`,
        fallback_agent_id: fallbackDecision.agent_id,
        fallback_agent_name: fallbackDecision.agent_name || 'Unknown',
        original_confidence: decision.confidence,
        timestamp: new Date().toISOString(),
        session_id: context.session_id,
        query: context.query,
      });
      
      return fallbackDecision;
    }
    
    return decision;
  } catch (error) {
    if (error instanceof AgentNotFoundError) {
      const fallbackDecision = createFallbackDecision(
        FallbackReason.AGENT_UNAVAILABLE,
        decision.agent_id,
        decision.confidence
      );
      
      logFallbackEvent({
        reason: FallbackReason.AGENT_UNAVAILABLE,
        error_message: error.message,
        fallback_agent_id: fallbackDecision.agent_id,
        fallback_agent_name: fallbackDecision.agent_name || 'Unknown',
        original_confidence: decision.confidence,
        timestamp: new Date().toISOString(),
        session_id: context.session_id,
        query: context.query,
      });
      
      return fallbackDecision;
    }
    
    throw error;
  }
}

/**
 * Route a query with comprehensive fallback handling
 * 
 * This function NEVER throws errors - it always returns a valid routing decision.
 * 
 * Fallback scenarios handled:
 * 1. Low confidence (<0.6) - Falls back to default agent
 * 2. API timeout (>5s) - Falls back to default agent
 * 3. API errors (auth, rate limit, etc.) - Falls back to default agent
 * 4. Agent unavailable - Falls back to default agent
 * 5. Registry errors - Falls back to default agent
 * 6. Unknown errors - Falls back to default agent
 * 
 * @param context - Routing context with query, conversation history, session ID
 * @returns Promise<RoutingDecision> - Always returns a valid decision (never throws)
 */
export async function routeWithFallback(
  context: RoutingContext
): Promise<RoutingDecisionWithUsage> {
  try {
    // Validate we have available agents
    if (!context.available_agents || context.available_agents.length === 0) {
      // Try to load available agents from registry
      try {
        context.available_agents = getAvailableAgents();
      } catch (registryError) {
        const fallbackDecision = createFallbackDecision(
          FallbackReason.REGISTRY_ERROR,
          registryError instanceof Error ? registryError.message : String(registryError)
        );
        
        logFallbackEvent({
          reason: FallbackReason.REGISTRY_ERROR,
          error_message: registryError instanceof Error ? registryError.message : String(registryError),
          fallback_agent_id: fallbackDecision.agent_id,
          fallback_agent_name: fallbackDecision.agent_name || 'Unknown',
          timestamp: new Date().toISOString(),
          session_id: context.session_id,
          query: context.query,
        });
        
        return fallbackDecision;
      }
    }
    
    // Call the main routing function
    const decision = await routeQuery(context);
    
    // If the decision is already a fallback, log it and return
    if (decision.fallback) {
      // Determine the fallback reason from the decision
      let reason = FallbackReason.UNKNOWN_ERROR;
      if (decision.reasoning.includes('Low confidence')) {
        reason = FallbackReason.LOW_CONFIDENCE;
      } else if (decision.reasoning.includes('Empty query')) {
        reason = FallbackReason.EMPTY_QUERY;
      } else if (decision.reasoning.includes('no API key')) {
        reason = FallbackReason.NO_API_KEY;
      }
      
      logFallbackEvent({
        reason,
        error_message: decision.reasoning,
        fallback_agent_id: decision.agent_id,
        fallback_agent_name: decision.agent_name || 'Unknown',
        original_confidence: decision.confidence,
        timestamp: new Date().toISOString(),
        session_id: context.session_id,
        query: context.query,
      });
    }
    
    // Validate that the selected agent is available
    return validateAgentAvailability(decision, context);
    
  } catch (error) {
    // Determine the specific error type for better fallback reasoning
    let fallbackReason = FallbackReason.UNKNOWN_ERROR;
    let errorMessage = error instanceof Error ? error.message : String(error);
    
    if (error instanceof OpenAITimeoutError) {
      fallbackReason = FallbackReason.TIMEOUT;
    } else if (error instanceof OpenAIRateLimitError) {
      fallbackReason = FallbackReason.RATE_LIMIT;
    } else if (error instanceof OpenAIAuthError) {
      fallbackReason = FallbackReason.API_ERROR;
      errorMessage = 'Invalid or missing API key';
    } else if (error instanceof RoutingError) {
      fallbackReason = FallbackReason.API_ERROR;
    } else if (error instanceof AgentNotFoundError) {
      fallbackReason = FallbackReason.AGENT_UNAVAILABLE;
    }
    
    const fallbackDecision = createFallbackDecision(fallbackReason, errorMessage);
    
    logFallbackEvent({
      reason: fallbackReason,
      error_message: errorMessage,
      fallback_agent_id: fallbackDecision.agent_id,
      fallback_agent_name: fallbackDecision.agent_name || 'Unknown',
      timestamp: new Date().toISOString(),
      session_id: context.session_id,
      query: context.query,
    });
    
    return fallbackDecision;
  }
}

/**
 * Test helper: Simulate various error scenarios
 * Only used in tests to validate fallback behavior
 */
export async function testFallback(
  scenario: 'timeout' | 'api_error' | 'agent_unavailable' | 'registry_error' | 'unknown'
): Promise<RoutingDecision> {
  const context: RoutingContext = {
    query: 'test query',
    conversation_context: [],
    session_id: 'test-session',
    available_agents: [],
  };
  
  switch (scenario) {
    case 'timeout':
      throw new OpenAITimeoutError('Simulated timeout');
    case 'api_error':
      throw new RoutingError('Simulated API error');
    case 'agent_unavailable':
      throw new AgentNotFoundError('test-agent');
    case 'registry_error':
      throw new Error('Simulated registry error');
    case 'unknown':
      throw new Error('Simulated unknown error');
    default:
      return await routeWithFallback(context);
  }
}
