/**
 * Dojo Agent Handler
 * 
 * Core thinking partnership for exploration, synthesis, and convergence.
 * Operates in four modes: Mirror, Scout, Gardener, Implementation.
 * 
 * @module lib/agents/dojo-handler
 */

import type { DojoPacket, NextMove, Perspective, Assumption } from '../packet/schema';
import type { AgentInvocationContext, ChatMessage } from './types';
import { logEvent, isTraceActive } from '../harness/trace';
import { z } from 'zod';
import { LLMClient } from '../llm/client';
import { getModelForAgent } from '../llm/registry';

export type DojoMode = 'Mirror' | 'Scout' | 'Gardener' | 'Implementation';

export interface DojoAgentQuery {
  packet: DojoPacket;
  conversation_history: AgentInvocationContext['conversation_history'];
}

export interface DojoAgentResponse {
  next_move: NextMove;
  updated_packet: DojoPacket;
  summary: string;
}

export class DojoAgentError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DojoAgentError';
  }
}

/**
 * LLM client instance for Dojo Agent operations
 */
const llmClient = new LLMClient();

/**
 * Zod schema for Mirror mode LLM response
 */
const MirrorModeResponseSchema = z.object({
  summary: z.string(),
  pattern: z.string(),
  assumptions: z.array(z.string()),
  tensions: z.array(z.string()),
  reframes: z.array(z.string()),
});

type MirrorModeResponse = z.infer<typeof MirrorModeResponseSchema>;

/**
 * Zod schema for Scout mode LLM response
 */
const ScoutModeResponseSchema = z.object({
  summary: z.string(),
  routes: z.array(z.object({
    name: z.string(),
    description: z.string(),
    tradeoffs: z.string(),
  })),
  smallest_test: z.string(),
});

type ScoutModeResponse = z.infer<typeof ScoutModeResponseSchema>;

/**
 * Zod schema for Gardener mode LLM response
 */
const GardenerModeResponseSchema = z.object({
  summary: z.string(),
  strong_ideas: z.array(z.string()),
  ideas_to_grow: z.array(z.string()),
  ideas_to_compost: z.array(z.string()).optional(),
});

type GardenerModeResponse = z.infer<typeof GardenerModeResponseSchema>;

/**
 * Zod schema for Implementation mode LLM response
 */
const ImplementationModeResponseSchema = z.object({
  summary: z.string(),
  plan: z.array(z.string()).min(1).max(5),
  first_step: z.string(),
});

type ImplementationModeResponse = z.infer<typeof ImplementationModeResponseSchema>;

/**
 * Builds a DojoPacket from AgentInvocationContext.
 * Creates a minimal packet if none exists, or uses existing packet data.
 * 
 * @param context - Agent invocation context from Supervisor
 * @returns DojoPacket constructed from context
 */
export function buildDojoPacketFromContext(
  context: AgentInvocationContext
): DojoPacket {
  const now = new Date().toISOString();
  
  const userMessages = context.conversation_history.filter(msg => msg.role === 'user');
  const lastUserMessage = userMessages[userMessages.length - 1]?.content || context.user_intent;
  
  const existingPerspectives: Perspective[] = userMessages.map(msg => ({
    text: msg.content,
    source: 'user' as const,
    timestamp: msg.timestamp || now,
  }));

  const packet: DojoPacket = {
    version: '1.0',
    session: {
      id: context.session_id,
      title: 'Dojo Session',
      mode: 'Mirror',
      duration: 0,
      created_at: now,
      updated_at: now,
      agent_path: ['dojo'],
    },
    situation: lastUserMessage,
    stake: null,
    perspectives: existingPerspectives,
    assumptions: [],
    decisions: [],
    next_move: {
      action: 'Explore perspectives',
      why: 'Starting new thinking session',
      smallest_test: null,
    },
    artifacts: [],
    trace_summary: {
      total_events: 0,
      agent_transitions: 0,
      cost_total: 0,
      tokens_total: 0,
    },
    metadata: {
      exported_at: now,
      exported_by: null,
      format: 'json',
    },
  };

  return packet;
}

/**
 * Selects the appropriate Dojo mode based on user cues and packet state.
 * 
 * Convergence cues → Implementation
 * Exploratory cues → Mirror or Scout
 * Messy state (many perspectives) → Gardener
 * Default → Mirror
 * 
 * @param packet - Current DojoPacket state
 * @param conversationHistory - Recent conversation messages
 * @returns Selected DojoMode
 */
export function selectDojoMode(
  packet: DojoPacket,
  conversationHistory: ChatMessage[]
): DojoMode {
  // Default to Mirror mode for empty conversations
  if (!conversationHistory || conversationHistory.length === 0) {
    return 'Mirror';
  }

  // Analyze the last 3 messages to detect user intent
  const recentMessages = conversationHistory.slice(-3);
  const lastUserMessage = recentMessages
    .filter(msg => msg.role === 'user')
    .pop()?.content.toLowerCase() || '';

  // Convergence cues: User is ready to take action
  const convergenceCues = [
    "let's do it",
    "let's build",
    "i'm ready",
    "what's the plan",
    "give me a plan",
    "how do i start",
    "what are the steps",
    "let's go",
    "make it happen",
  ];

  // Scout cues: User wants to explore options and tradeoffs
  const scoutCues = [
    "what are my options",
    "what could i do",
    "show me routes",
    "what paths",
    "alternatives",
    "tradeoffs",
    "which way should",
  ];

  // Gardener cues: User has too many ideas and needs focus
  const gardenerCues = [
    "too many ideas",
    "help me focus",
    "which ideas",
    "narrow down",
    "prioritize",
    "trim",
    "prune",
  ];

  // Check for explicit convergence signals first (highest priority)
  if (convergenceCues.some(cue => lastUserMessage.includes(cue))) {
    return 'Implementation';
  }

  // Check for explicit scout requests
  if (scoutCues.some(cue => lastUserMessage.includes(cue))) {
    return 'Scout';
  }

  // Check for gardener requests or too many perspectives (>5)
  if (gardenerCues.some(cue => lastUserMessage.includes(cue)) || packet.perspectives.length > 5) {
    return 'Gardener';
  }

  // Default to Mirror mode for reflection and exploration
  return 'Mirror';
}

/**
 * Main orchestrator for Dojo Agent queries.
 * Routes to appropriate mode handler based on mode selection.
 * 
 * @param query - Dojo agent query with packet and context
 * @returns Dojo agent response with updated packet and next move
 * @throws DojoAgentError if mode handler fails
 */
export async function handleDojoQuery(
  query: DojoAgentQuery
): Promise<DojoAgentResponse> {
  const startTime = Date.now();

  try {
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_START', 
        {
          agent_id: 'dojo',
          message: 'Analyzing situation and selecting mode...',
          progress: 0,
        },
        {
          parent_type: 'agent_operation',
          metadata: { situation: query.packet.situation },
        }
      );
    }

    const mode = selectDojoMode(query.packet, query.conversation_history);

    if (isTraceActive()) {
      logEvent('MODE_TRANSITION',
        {
          agent_id: 'dojo',
          from_mode: query.packet.session.mode,
          to_mode: mode,
        },
        {
          mode_selected: mode,
        },
        {
          mode: mode,
        }
      );
    }

    let response: DojoAgentResponse;

    switch (mode) {
      case 'Mirror':
        response = await handleMirrorMode(query.packet);
        break;
      case 'Scout':
        response = await handleScoutMode(query.packet);
        break;
      case 'Gardener':
        response = await handleGardenerMode(query.packet);
        break;
      case 'Implementation':
        response = await handleImplementationMode(query.packet);
        break;
      default:
        response = await handleMirrorMode(query.packet);
    }

    response.updated_packet.session.mode = mode;
    response.updated_packet.session.updated_at = new Date().toISOString();

    const duration = Date.now() - startTime;

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE',
        {
          agent_id: 'dojo',
          message: `Completed in ${mode} mode`,
          progress: 100,
        },
        {
          parent_type: 'agent_operation',
          metadata: {
            mode: mode,
            duration_ms: duration,
          },
        }
      );
    }

    return response;
  } catch (error) {
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE',
        {
          agent_id: 'dojo',
          message: 'Dojo agent failed',
          status: 'error',
        },
        {
          parent_type: 'agent_operation',
          metadata: {
            error: error instanceof Error ? error.message : String(error),
          },
        }
      );
    }

    if (error instanceof DojoAgentError) {
      throw error;
    }

    throw new DojoAgentError(
      `Dojo agent failed: ${error instanceof Error ? error.message : String(error)}`,
      'HANDLER_FAILED',
      error
    );
  }
}

/**
 * Mirror mode handler: Summarize patterns, identify assumptions/tensions, offer reframes.
 * 
 * @param packet - Current DojoPacket
 * @returns DojoAgentResponse with reflection and reframes
 */
async function handleMirrorMode(packet: DojoPacket): Promise<DojoAgentResponse> {
  const startTime = Date.now();

  try {
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_START', 
        {
          agent_id: 'dojo',
          mode: 'Mirror',
          message: 'Reflecting on patterns and tensions...',
          progress: 0,
        },
        {},
        {
          parent_type: 'agent_operation',
          metadata: { 
            situation: packet.situation,
            perspectives_count: packet.perspectives.length,
          },
        }
      );
    }

    const perspectivesText = packet.perspectives
      .map((p, i) => `${i + 1}. ${p.text}`)
      .join('\n');

    const prompt = `You are the Dojo Agent in Mirror Mode. Your role is to reflect the user's thinking back to them with clarity.

Situation: ${packet.situation}
Stake: ${packet.stake || 'Not specified'}
Perspectives:
${perspectivesText || 'None yet'}

Provide:
1. A brief summary (2-3 sentences) of the pattern you see across these perspectives
2. 1-3 key assumptions underlying their thinking
3. 1-2 tensions or contradictions (if any)
4. 1-2 reframes to shift their perspective

Respond in JSON format with the following structure:
{
  "summary": "Brief summary of the pattern",
  "pattern": "Detailed pattern description",
  "assumptions": ["assumption1", "assumption2"],
  "tensions": ["tension1", "tension2"],
  "reframes": ["reframe1", "reframe2"]
}`;

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'dojo',
          mode: 'Mirror',
          message: 'Calling LLM for reflection...',
          progress: 30,
        },
        {},
        {
          parent_type: 'agent_operation',
        }
      );
    }

    const model = getModelForAgent('dojo');
    const { data, usage } = await llmClient.createJSONCompletion<MirrorModeResponse>(
      model,
      [{ role: 'user', content: prompt }],
      {
        temperature: 0.7,
        timeout: 30000,
      }
    );

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'dojo',
          mode: 'Mirror',
          message: 'Validating and processing response...',
          progress: 70,
        },
        {},
        {
          parent_type: 'agent_operation',
          metadata: {
            tokens_used: usage.total_tokens,
          },
        }
      );
    }

    const validated = MirrorModeResponseSchema.parse(data);

    const newAssumptions: Assumption[] = validated.assumptions.map(text => ({
      text,
      challenged: false,
      timestamp: new Date().toISOString(),
    }));

    const reframePerspective: Perspective = {
      text: `Reframes: ${validated.reframes.join(' | ')}`,
      source: 'agent' as const,
      timestamp: new Date().toISOString(),
    };

    const updatedPacket: DojoPacket = {
      ...packet,
      assumptions: [...packet.assumptions, ...newAssumptions],
      perspectives: [...packet.perspectives, reframePerspective],
    };

    const duration = Date.now() - startTime;

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE',
        {
          agent_id: 'dojo',
          mode: 'Mirror',
          message: 'Mirror reflection complete',
          progress: 100,
        },
        {
          assumptions_found: validated.assumptions.length,
          tensions_found: validated.tensions.length,
          reframes_offered: validated.reframes.length,
        },
        {
          parent_type: 'agent_operation',
          metadata: {
            duration_ms: duration,
            token_count: usage.total_tokens,
          },
        }
      );
    }

    let summaryText = `**Pattern:** ${validated.pattern}\n\n`;
    
    if (validated.assumptions.length > 0) {
      summaryText += `**Key Assumptions:**\n${validated.assumptions.map(a => `• ${a}`).join('\n')}\n\n`;
    }
    
    if (validated.tensions.length > 0) {
      summaryText += `**Tensions:**\n${validated.tensions.map(t => `• ${t}`).join('\n')}\n\n`;
    }
    
    if (validated.reframes.length > 0) {
      summaryText += `**Reframes:**\n${validated.reframes.map(r => `• ${r}`).join('\n')}`;
    }

    return {
      next_move: {
        action: validated.assumptions.length > 0 
          ? `Explore assumption: ${validated.assumptions[0]}` 
          : 'Continue exploring perspectives',
        why: 'Mirror mode reflection complete',
        smallest_test: validated.tensions.length > 0 
          ? `Test this tension: ${validated.tensions[0]}` 
          : null,
      },
      updated_packet: updatedPacket,
      summary: summaryText,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE',
        {
          agent_id: 'dojo',
          mode: 'Mirror',
          message: 'Mirror mode failed',
          status: 'error',
        },
        {},
        {
          parent_type: 'agent_operation',
          metadata: {
            duration_ms: duration,
            error: error instanceof Error ? error.message : String(error),
          },
        }
      );
    }

    return {
      next_move: {
        action: 'Reflect on current situation',
        why: 'Unable to process detailed reflection, continuing with basic guidance',
        smallest_test: null,
      },
      updated_packet: packet,
      summary: `I encountered an issue while reflecting (${error instanceof Error ? error.message : String(error)}). Let's continue exploring your situation step by step.`,
    };
  }
}

/**
 * Scout mode handler: Offer 2-4 routes with tradeoffs and smallest test.
 * 
 * @param packet - Current DojoPacket
 * @returns DojoAgentResponse with routes and smallest test
 */
async function handleScoutMode(packet: DojoPacket): Promise<DojoAgentResponse> {
  const startTime = Date.now();

  try {
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_START', 
        {
          agent_id: 'dojo',
          mode: 'Scout',
          message: 'Mapping routes and exploring possibilities...',
          progress: 0,
        },
        {},
        {
          parent_type: 'agent_operation',
          metadata: { 
            situation: packet.situation,
            perspectives_count: packet.perspectives.length,
          },
        }
      );
    }

    const perspectivesText = packet.perspectives
      .map((p, i) => `${i + 1}. ${p.text}`)
      .join('\n');

    const prompt = `You are the Dojo Agent in Scout Mode. Your role is to map clear routes with honest tradeoffs.

Situation: ${packet.situation}
Stake: ${packet.stake || 'Not specified'}
Perspectives:
${perspectivesText || 'None yet'}

Provide:
1. 2-4 distinct routes the user could take
2. For each route: name, brief description, and key tradeoffs (not just pros)
3. ONE "smallest test" - a concrete action to learn fast without full commitment

Keep routes actionable and tradeoffs honest.

Respond in JSON format with the following structure:
{
  "summary": "Brief overview of the routes being considered",
  "routes": [
    {
      "name": "Route name",
      "description": "Brief description of this route",
      "tradeoffs": "Key tradeoffs (pros AND cons)"
    }
  ],
  "smallest_test": "One concrete action to learn fast"
}`;

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'dojo',
          mode: 'Scout',
          message: 'Calling LLM to map routes...',
          progress: 30,
        },
        {},
        {
          parent_type: 'agent_operation',
        }
      );
    }

    const model = getModelForAgent('dojo');
    const { data, usage } = await llmClient.createJSONCompletion<ScoutModeResponse>(
      model,
      [{ role: 'user', content: prompt }],
      {
        temperature: 0.7,
        timeout: 30000,
      }
    );

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'dojo',
          mode: 'Scout',
          message: 'Validating and processing routes...',
          progress: 70,
        },
        {},
        {
          parent_type: 'agent_operation',
          metadata: {
            tokens_used: usage.total_tokens,
          },
        }
      );
    }

    const validated = ScoutModeResponseSchema.parse(data);

    const routePerspectives: Perspective[] = validated.routes.map(route => ({
      text: `Route: ${route.name} - ${route.description} | Tradeoffs: ${route.tradeoffs}`,
      source: 'agent' as const,
      timestamp: new Date().toISOString(),
    }));

    const updatedPacket: DojoPacket = {
      ...packet,
      perspectives: [...packet.perspectives, ...routePerspectives],
    };

    const duration = Date.now() - startTime;

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE',
        {
          agent_id: 'dojo',
          mode: 'Scout',
          message: 'Scout route mapping complete',
          progress: 100,
        },
        {
          routes_found: validated.routes.length,
          smallest_test_provided: true,
        },
        {
          parent_type: 'agent_operation',
          metadata: {
            duration_ms: duration,
            token_count: usage.total_tokens,
          },
        }
      );
    }

    let summaryText = `**Routes to consider:**\n\n`;
    
    validated.routes.forEach((route, i) => {
      summaryText += `**${i + 1}. ${route.name}**\n`;
      summaryText += `${route.description}\n`;
      summaryText += `*Tradeoffs:* ${route.tradeoffs}\n\n`;
    });
    
    summaryText += `**Smallest Test:**\n${validated.smallest_test}`;

    return {
      next_move: {
        action: validated.smallest_test,
        why: 'Scout mode - smallest test to learn fast',
        smallest_test: validated.smallest_test,
      },
      updated_packet: updatedPacket,
      summary: summaryText,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE',
        {
          agent_id: 'dojo',
          mode: 'Scout',
          message: 'Scout mode failed',
          status: 'error',
        },
        {},
        {
          parent_type: 'agent_operation',
          metadata: {
            duration_ms: duration,
            error: error instanceof Error ? error.message : String(error),
          },
        }
      );
    }

    return {
      next_move: {
        action: 'Explore possible routes',
        why: 'Unable to map detailed routes, continuing with basic exploration',
        smallest_test: 'Consider one aspect of the situation and test it',
      },
      updated_packet: packet,
      summary: `I encountered an issue while mapping routes (${error instanceof Error ? error.message : String(error)}). Let's explore your options step by step.`,
    };
  }
}

/**
 * Gardener mode handler: Highlight 2-3 strong ideas, identify 1-2 that need growth.
 * 
 * @param packet - Current DojoPacket
 * @returns DojoAgentResponse with pruned ideas
 */
async function handleGardenerMode(packet: DojoPacket): Promise<DojoAgentResponse> {
  const startTime = Date.now();

  try {
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_START', 
        {
          agent_id: 'dojo',
          mode: 'Gardener',
          message: 'Pruning ideas and highlighting strengths...',
          progress: 0,
        },
        {},
        {
          parent_type: 'agent_operation',
          metadata: { 
            situation: packet.situation,
            perspectives_count: packet.perspectives.length,
          },
        }
      );
    }

    const perspectivesText = packet.perspectives
      .map((p, i) => `${i + 1}. ${p.text}`)
      .join('\n');

    const prompt = `You are the Dojo Agent in Gardener Mode. Your role is to help the user focus by pruning ideas with direct, honest guidance.

Situation: ${packet.situation}
Stake: ${packet.stake || 'Not specified'}
Ideas/Perspectives:
${perspectivesText || 'None yet'}

Provide:
1. 2-3 strong ideas that deserve focus and energy
2. 1-2 ideas that need growth or more development before pursuing
3. (Optional) Ideas to compost - those that can be let go

Be direct. Don't soften your guidance with excessive diplomacy. Help the user focus their energy.

Respond in JSON format with the following structure:
{
  "summary": "Brief overview of the pruning process",
  "strong_ideas": ["idea1", "idea2", "idea3"],
  "ideas_to_grow": ["idea1", "idea2"],
  "ideas_to_compost": ["idea1", "idea2"]
}`;

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'dojo',
          mode: 'Gardener',
          message: 'Calling LLM to prune ideas...',
          progress: 30,
        },
        {},
        {
          parent_type: 'agent_operation',
        }
      );
    }

    const model = getModelForAgent('dojo');
    const { data, usage } = await llmClient.createJSONCompletion<GardenerModeResponse>(
      model,
      [{ role: 'user', content: prompt }],
      {
        temperature: 0.7,
        timeout: 30000,
      }
    );

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'dojo',
          mode: 'Gardener',
          message: 'Validating and processing pruning guidance...',
          progress: 70,
        },
        {},
        {
          parent_type: 'agent_operation',
          metadata: {
            tokens_used: usage.total_tokens,
          },
        }
      );
    }

    const validated = GardenerModeResponseSchema.parse(data);

    const focusPerspective: Perspective = {
      text: `Gardener guidance: Focus on ${validated.strong_ideas.length} strong ideas`,
      source: 'agent' as const,
      timestamp: new Date().toISOString(),
    };

    const updatedPacket: DojoPacket = {
      ...packet,
      perspectives: [...packet.perspectives, focusPerspective],
    };

    const duration = Date.now() - startTime;

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE',
        {
          agent_id: 'dojo',
          mode: 'Gardener',
          message: 'Gardener pruning complete',
          progress: 100,
        },
        {
          strong_ideas_count: validated.strong_ideas.length,
          ideas_to_grow_count: validated.ideas_to_grow.length,
          ideas_to_compost_count: validated.ideas_to_compost?.length || 0,
        },
        {
          parent_type: 'agent_operation',
          metadata: {
            duration_ms: duration,
            token_count: usage.total_tokens,
          },
        }
      );
    }

    let summaryText = `**Strong Ideas (focus here):**\n${validated.strong_ideas.map(i => `• ${i}`).join('\n')}\n\n`;
    
    if (validated.ideas_to_grow.length > 0) {
      summaryText += `**Ideas to Grow (need more development):**\n${validated.ideas_to_grow.map(i => `• ${i}`).join('\n')}\n\n`;
    }
    
    if (validated.ideas_to_compost && validated.ideas_to_compost.length > 0) {
      summaryText += `**Ideas to Compost (let go):**\n${validated.ideas_to_compost.map(i => `• ${i}`).join('\n')}`;
    }

    return {
      next_move: {
        action: validated.strong_ideas.length > 0 
          ? `Focus on: ${validated.strong_ideas[0]}` 
          : 'Develop the strongest idea further',
        why: 'Gardener mode - focusing energy on strongest ideas',
        smallest_test: validated.strong_ideas.length > 0 
          ? `Take one small step on: ${validated.strong_ideas[0]}` 
          : null,
      },
      updated_packet: updatedPacket,
      summary: summaryText,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE',
        {
          agent_id: 'dojo',
          mode: 'Gardener',
          message: 'Gardener mode failed',
          status: 'error',
        },
        {},
        {
          parent_type: 'agent_operation',
          metadata: {
            duration_ms: duration,
            error: error instanceof Error ? error.message : String(error),
          },
        }
      );
    }

    return {
      next_move: {
        action: 'Review and focus ideas',
        why: 'Unable to provide detailed pruning, continuing with basic guidance',
        smallest_test: 'Pick the idea that excites you most and test it',
      },
      updated_packet: packet,
      summary: `I encountered an issue while pruning ideas (${error instanceof Error ? error.message : String(error)}). Let's focus your ideas step by step.`,
    };
  }
}

/**
 * Implementation mode handler: Provide concrete 1-5 step plan.
 * 
 * @param packet - Current DojoPacket
 * @returns DojoAgentResponse with action plan
 */
async function handleImplementationMode(packet: DojoPacket): Promise<DojoAgentResponse> {
  const startTime = Date.now();

  try {
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_START', 
        {
          agent_id: 'dojo',
          mode: 'Implementation',
          message: 'Creating concrete action plan...',
          progress: 0,
        },
        {},
        {
          parent_type: 'agent_operation',
          metadata: { 
            situation: packet.situation,
            decisions_count: packet.decisions.length,
          },
        }
      );
    }

    const perspectivesText = packet.perspectives
      .map((p, i) => `${i + 1}. ${p.text}`)
      .join('\n');

    const decisionsText = packet.decisions
      .map((d, i) => `${i + 1}. ${d.text}`)
      .join('\n');

    const prompt = `You are the Dojo Agent in Implementation Mode. Your role is to provide a concrete, actionable plan.

Situation: ${packet.situation}
Stake: ${packet.stake || 'Not specified'}

Perspectives considered:
${perspectivesText || 'None yet'}

Decisions made:
${decisionsText || 'None yet'}

Provide:
1. A concrete action plan with 1-5 steps (NOT 20+ steps)
2. Each step should be actionable and sequenced logically
3. The user should be able to start step 1 within 5 minutes
4. Steps should reflect the existing decisions

Keep the plan focused and executable.

Respond in JSON format with the following structure:
{
  "summary": "Brief overview of the plan",
  "plan": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "first_step": "The first actionable step to take right now"
}`;

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'dojo',
          mode: 'Implementation',
          message: 'Calling LLM to generate plan...',
          progress: 30,
        },
        {},
        {
          parent_type: 'agent_operation',
        }
      );
    }

    const model = getModelForAgent('dojo');
    const { data, usage } = await llmClient.createJSONCompletion<ImplementationModeResponse>(
      model,
      [{ role: 'user', content: prompt }],
      {
        temperature: 0.7,
        timeout: 30000,
      }
    );

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'dojo',
          mode: 'Implementation',
          message: 'Validating and processing plan...',
          progress: 70,
        },
        {},
        {
          parent_type: 'agent_operation',
          metadata: {
            tokens_used: usage.total_tokens,
          },
        }
      );
    }

    const validated = ImplementationModeResponseSchema.parse(data);

    const planPerspective: Perspective = {
      text: `Implementation Plan: ${validated.plan.join(' → ')}`,
      source: 'agent' as const,
      timestamp: new Date().toISOString(),
    };

    const updatedPacket: DojoPacket = {
      ...packet,
      perspectives: [...packet.perspectives, planPerspective],
    };

    const duration = Date.now() - startTime;

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE',
        {
          agent_id: 'dojo',
          mode: 'Implementation',
          message: 'Implementation plan generated',
          progress: 100,
        },
        {
          plan_steps_count: validated.plan.length,
          first_step_provided: true,
        },
        {
          parent_type: 'agent_operation',
          metadata: {
            duration_ms: duration,
            token_count: usage.total_tokens,
          },
        }
      );
    }

    let summaryText = `**Action Plan:**\n\n`;
    
    validated.plan.forEach((step, i) => {
      summaryText += `**${i + 1}.** ${step}\n`;
    });
    
    summaryText += `\n**Start here:** ${validated.first_step}`;

    return {
      next_move: {
        action: validated.first_step,
        why: 'Implementation mode - concrete plan ready to execute',
        smallest_test: validated.first_step,
      },
      updated_packet: updatedPacket,
      summary: summaryText,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE',
        {
          agent_id: 'dojo',
          mode: 'Implementation',
          message: 'Implementation mode failed',
          status: 'error',
        },
        {},
        {
          parent_type: 'agent_operation',
          metadata: {
            duration_ms: duration,
            error: error instanceof Error ? error.message : String(error),
          },
        }
      );
    }

    return {
      next_move: {
        action: 'Start with the first concrete step',
        why: 'Unable to generate detailed plan, continuing with basic guidance',
        smallest_test: 'Take one small action toward your goal',
      },
      updated_packet: packet,
      summary: `I encountered an issue while creating the plan (${error instanceof Error ? error.message : String(error)}). Let's start with one concrete step and build from there.`,
    };
  }
}

/**
 * Invoke Dojo Agent from Supervisor handoff.
 * Main entry point when Supervisor routes a query to the Dojo agent.
 * 
 * @param context - Agent invocation context from handoff
 * @returns DojoAgentResponse with updated packet and next move
 */
export async function invokeDojoAgent(
  context: AgentInvocationContext
): Promise<DojoAgentResponse> {
  const packet = buildDojoPacketFromContext(context);
  
  const query: DojoAgentQuery = {
    packet,
    conversation_history: context.conversation_history,
  };

  const response = await handleDojoQuery(query);

  return response;
}
