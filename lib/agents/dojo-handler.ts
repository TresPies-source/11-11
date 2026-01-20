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
import { aiGateway } from '../ai-gateway';

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

    const systemPrompt = `You are Mirror, a calm spirit in a forest. Your purpose is to help the user see their own thoughts more clearly. You do this by reflecting back the patterns and tensions you notice in their words, using simple, flowing language.

- Start with a warm acknowledgment (e.g., "I hear you...", "Thank you for sharing...").
- Write in 3-4 short, simple paragraphs.
- Gently point out the core pattern or tension you see.
- Ask 1-2 open-ended questions to invite deeper reflection.
- Use emoji (🪞 ✨ 🌱) to add warmth and a touch of magic.
- Do NOT use lists, bolding, or complex markdown. Just simple, flowing text.
- Your tone is curious, gentle, and slightly magical.`;

    const userPrompt = `Situation: ${packet.situation}
Stake: ${packet.stake || 'Not specified'}
Perspectives:
${perspectivesText || 'None yet'}

Reflect back what you see in their thinking.`;

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

    const { content, usage } = await aiGateway.call(
      'general_chat',
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        temperature: 0.7,
        timeout: 30000,
        agentName: 'dojo',
      }
    );

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'dojo',
          mode: 'Mirror',
          message: 'Processing conversational response...',
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

    const mirrorPerspective: Perspective = {
      text: content,
      source: 'agent' as const,
      timestamp: new Date().toISOString(),
    };

    const updatedPacket: DojoPacket = {
      ...packet,
      perspectives: [...packet.perspectives, mirrorPerspective],
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
        {},
        {
          parent_type: 'agent_operation',
          metadata: {
            duration_ms: duration,
            token_count: usage.total_tokens,
          },
        }
      );
    }

    return {
      next_move: {
        action: 'Continue exploring perspectives',
        why: 'Mirror mode reflection complete',
        smallest_test: null,
      },
      updated_packet: updatedPacket,
      summary: content,
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

    const systemPrompt = `You are Scout, an adventurous guide. Your purpose is to help the user map out their options and understand the tradeoffs of each path. You are optimistic, clear, and encouraging.

- Start with an enthusiastic opening (e.g., "Let's map out your options!", "An exciting journey ahead!").
- Present 2-4 clear, distinct paths the user could take.
- For each path, briefly describe the potential reward and the potential risk (the tradeoff).
- Use emoji (🗺️ 🧭 ⚡) to add a sense of adventure.
- End with an encouraging question that prompts a decision.
- Your tone is energetic, clear, and inspiring.`;

    const userPrompt = `Situation: ${packet.situation}
Stake: ${packet.stake || 'Not specified'}
Perspectives:
${perspectivesText || 'None yet'}

Map out the possible paths forward.`;

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

    const { content, usage } = await aiGateway.call(
      'content_synthesis',
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        temperature: 0.7,
        timeout: 30000,
        agentName: 'dojo',
      }
    );

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'dojo',
          mode: 'Scout',
          message: 'Processing conversational response...',
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

    const scoutPerspective: Perspective = {
      text: content,
      source: 'agent' as const,
      timestamp: new Date().toISOString(),
    };

    const updatedPacket: DojoPacket = {
      ...packet,
      perspectives: [...packet.perspectives, scoutPerspective],
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
        {},
        {
          parent_type: 'agent_operation',
          metadata: {
            duration_ms: duration,
            token_count: usage.total_tokens,
          },
        }
      );
    }

    return {
      next_move: {
        action: 'Explore the paths ahead',
        why: 'Scout mode path mapping complete',
        smallest_test: null,
      },
      updated_packet: updatedPacket,
      summary: content,
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

    const systemPrompt = `You are Gardener, a wise and nurturing presence. Your purpose is to help the user tend to their garden of ideas—pruning what's no longer needed and giving space for the strongest ideas to grow.

- Start with a gentle, nurturing opening (e.g., "Let's tend to your garden of ideas...").
- Identify the 2-3 strongest, most promising ideas from the user's input.
- Gently suggest 1-2 ideas that might be less essential or could be set aside for now.
- Use gardening metaphors naturally (e.g., "This idea has strong roots," "Let's prune this one back a bit").
- Use emoji (🌱 ✂️ 🌿) to reinforce the gardening theme.
- Your tone is calm, wise, and supportive.`;

    const userPrompt = `Situation: ${packet.situation}
Stake: ${packet.stake || 'Not specified'}
Ideas/Perspectives:
${perspectivesText || 'None yet'}

Help me tend to my garden of ideas.`;

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

    const { content, usage } = await aiGateway.call(
      'content_synthesis',
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        temperature: 0.7,
        timeout: 30000,
        agentName: 'dojo',
      }
    );

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'dojo',
          mode: 'Gardener',
          message: 'Processing gardening guidance...',
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

    const gardenerPerspective: Perspective = {
      text: content,
      source: 'agent' as const,
      timestamp: new Date().toISOString(),
    };

    const updatedPacket: DojoPacket = {
      ...packet,
      perspectives: [...packet.perspectives, gardenerPerspective],
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
        {},
        {
          parent_type: 'agent_operation',
          metadata: {
            duration_ms: duration,
            token_count: usage.total_tokens,
          },
        }
      );
    }

    return {
      next_move: {
        action: 'Focus on the strongest ideas',
        why: 'Gardener mode - nurturing what has the most potential',
        smallest_test: 'Take one small step on your strongest idea',
      },
      updated_packet: updatedPacket,
      summary: content,
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

    const systemPrompt = `You are Builder, a pragmatic and focused craftsperson. Your purpose is to turn the user's converged idea into a concrete, actionable plan. You are direct, clear, and motivating.

- Start with a direct, action-oriented opening (e.g., "Alright, let's turn this into action!", "Time to build.").
- Provide a numbered list of 1-5 clear, actionable steps.
- Each step should be a concrete action the user can take RIGHT NOW.
- Keep the language simple and direct.
- End with a motivating statement to get them started.
- Use emoji (🛠️ 🚀 ✅) to create a sense of progress and accomplishment.
- Your tone is pragmatic, focused, and encouraging.`;

    const userMessage = `Situation: ${packet.situation}
Stake: ${packet.stake || 'Not specified'}

Perspectives considered:
${perspectivesText || 'None yet'}

Decisions made:
${decisionsText || 'None yet'}

Turn this into a concrete action plan.`;

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

    const { content, usage } = await aiGateway.call(
      'content_synthesis',
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      {
        temperature: 0.7,
        timeout: 30000,
        agentName: 'dojo',
      }
    );

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS',
        {
          agent_id: 'dojo',
          mode: 'Implementation',
          message: 'Processing plan response...',
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

    const planPerspective: Perspective = {
      text: content,
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
        {},
        {
          parent_type: 'agent_operation',
          metadata: {
            duration_ms: duration,
            token_count: usage.total_tokens,
          },
        }
      );
    }

    return {
      next_move: {
        action: 'Follow the action plan provided',
        why: 'Implementation mode - concrete plan ready to execute',
        smallest_test: 'Start with the first step in the plan',
      },
      updated_packet: updatedPacket,
      summary: content,
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
