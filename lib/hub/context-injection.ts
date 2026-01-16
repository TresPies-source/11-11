import { insertSession } from '@/lib/pglite/sessions';
import { insertKnowledgeLink } from '@/lib/pglite/knowledge-links';
import { insertSessionPerspective } from '@/lib/pglite/sessions';
import type { ArtifactType } from './types';
import type { SessionInsert } from '@/lib/pglite/types';

/**
 * Parameters for creating a new Dojo session from existing knowledge artifacts.
 * Used to inject context from prompts, seeds, or workbench files into a new conversation.
 */
export interface CreateFromContextParams {
  artifact_type: ArtifactType;
  artifact_id: string;
  situation: string;
  perspectives?: string[];
  user_id: string;
  title?: string;
}

/**
 * Result of creating a session from context.
 * Contains the new session ID and the knowledge link ID for tracking the relationship.
 */
export interface CreateFromContextResult {
  session_id: string;
  link_id: string;
}

/**
 * Creates a new Dojo session with pre-populated context from an existing artifact.
 * This enables the "Discuss in Dojo" workflow where users can start conversations
 * with prompts, seeds, or workbench files as initial context.
 * 
 * The function performs three key operations:
 * 1. Creates a new Dojo session with the situation field pre-populated
 * 2. Adds any provided perspectives to the session
 * 3. Creates a knowledge link with "discussed_in" relationship to track provenance
 * 
 * @param params - Configuration including artifact type/id, situation, optional perspectives
 * @returns Promise resolving to the new session ID and knowledge link ID
 * @throws Error if session creation or knowledge link creation fails
 * 
 * @example
 * ```ts
 * // Start a discussion from a prompt
 * const result = await createSessionFromContext({
 *   artifact_type: 'prompt',
 *   artifact_id: 'abc-123',
 *   situation: 'I want to discuss this prompt',
 *   perspectives: ['File content: ...'],
 *   user_id: 'user-456'
 * });
 * // Navigate to: /dojo/${result.session_id}
 * ```
 */
export async function createSessionFromContext(
  params: CreateFromContextParams
): Promise<CreateFromContextResult> {
  try {
    console.log('[CONTEXT_INJECTION] Creating session from context:', {
      artifact_type: params.artifact_type,
      artifact_id: params.artifact_id,
      situation: params.situation?.substring(0, 50) + '...',
    });

    const sessionData: SessionInsert = {
      user_id: params.user_id,
      title: params.title || null,
      situation: params.situation,
      mode: null,
      stake: null,
      agent_path: [],
      artifacts: [],
      total_tokens: 0,
      total_cost_usd: 0,
    };

    const newSession = await insertSession(sessionData);
    console.log('[CONTEXT_INJECTION] Session created:', newSession.id);

    if (params.perspectives && params.perspectives.length > 0) {
      for (const perspective of params.perspectives) {
        await insertSessionPerspective({
          session_id: newSession.id,
          text: perspective,
          source: 'user',
        });
      }
      console.log(`[CONTEXT_INJECTION] Added ${params.perspectives.length} perspectives`);
    }

    const linkData = {
      source_type: params.artifact_type,
      source_id: params.artifact_id,
      target_type: 'session' as ArtifactType,
      target_id: newSession.id,
      relationship: 'discussed_in' as const,
      metadata: {
        context_type: params.artifact_type,
        created_from_context: true,
      },
      user_id: params.user_id,
    };

    const knowledgeLink = await insertKnowledgeLink(linkData);
    console.log('[CONTEXT_INJECTION] Knowledge link created:', knowledgeLink.id);

    return {
      session_id: newSession.id,
      link_id: knowledgeLink.id,
    };
  } catch (error) {
    console.error('[CONTEXT_INJECTION] Error creating session from context:', error);
    throw error;
  }
}
