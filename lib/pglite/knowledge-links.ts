import { getDB } from './client';
import type { KnowledgeLink, KnowledgeLinkInsert, LineageNode, ArtifactType } from '../hub/types';

/**
 * Inserts a new knowledge link into the database.
 * Knowledge links create relationships between artifacts (prompts, seeds, sessions, files).
 * 
 * @param link - The knowledge link data to insert
 * @returns Promise resolving to the created knowledge link with parsed metadata
 * @throws Error if database insertion fails
 * 
 * @example
 * ```ts
 * const link = await insertKnowledgeLink({
 *   source_type: 'prompt',
 *   source_id: 'abc-123',
 *   target_type: 'session',
 *   target_id: 'xyz-789',
 *   relationship: 'discussed_in',
 *   user_id: 'user-456',
 *   metadata: { context: 'initial discussion' }
 * });
 * ```
 */
export async function insertKnowledgeLink(link: KnowledgeLinkInsert): Promise<KnowledgeLink> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      `INSERT INTO knowledge_links (
        source_type, source_id, target_type, target_id, relationship, metadata, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        link.source_type,
        link.source_id,
        link.target_type,
        link.target_id,
        link.relationship,
        JSON.stringify(link.metadata || {}),
        link.user_id,
      ]
    );
    
    const knowledgeLink = result.rows[0] as any;
    console.log(`[KNOWLEDGE_LINKS] Inserted link ${knowledgeLink.id}: ${link.source_type}:${link.source_id} -> ${link.target_type}:${link.target_id}`);
    
    return {
      ...knowledgeLink,
      metadata: typeof knowledgeLink.metadata === 'string' 
        ? JSON.parse(knowledgeLink.metadata) 
        : knowledgeLink.metadata,
    };
  } catch (error) {
    console.error('[KNOWLEDGE_LINKS] Error inserting knowledge link:', error);
    throw error;
  }
}

/**
 * Retrieves the knowledge lineage graph for a given artifact.
 * Returns all related artifacts (both upstream and downstream) with their metadata.
 * 
 * This function performs a bidirectional search to find all knowledge links where the
 * artifact is either a source or target, then enriches the results with artifact metadata.
 * 
 * @param type - The type of the artifact (prompt, seed, session, file)
 * @param id - The unique identifier of the artifact
 * @param userId - The user ID to filter results by ownership
 * @returns Promise resolving to an array of lineage nodes with metadata
 * @throws Error if database query fails
 * 
 * @example
 * ```ts
 * const lineage = await getLineage('prompt', 'abc-123', 'user-456');
 * // Returns: [{ type: 'session', id: 'xyz', title: 'Discussion', relationship: 'discussed_in', ... }]
 * ```
 */
export async function getLineage(
  type: ArtifactType, 
  id: string, 
  userId: string
): Promise<LineageNode[]> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      `SELECT 
        kl.id,
        kl.source_type,
        kl.source_id,
        kl.target_type,
        kl.target_id,
        kl.relationship,
        kl.created_at
      FROM knowledge_links kl
      WHERE (
        (kl.source_type = $1 AND kl.source_id = $2) OR
        (kl.target_type = $1 AND kl.target_id = $2)
      )
      AND kl.user_id = $3
      ORDER BY kl.created_at DESC`,
      [type, id, userId]
    );
    
    const links = result.rows as any[];
    console.log(`[KNOWLEDGE_LINKS] Found ${links.length} links for ${type}:${id}`);
    
    const lineageNodes: LineageNode[] = [];
    
    for (const link of links) {
      const isSource = link.source_type === type && link.source_id === id;
      const relatedType = isSource ? link.target_type : link.source_type;
      const relatedId = isSource ? link.target_id : link.source_id;
      
      const metadata = await getArtifactMetadata(relatedType, relatedId);
      
      if (metadata) {
        lineageNodes.push({
          type: relatedType,
          id: relatedId,
          title: metadata.title,
          content_preview: metadata.content_preview,
          created_at: metadata.created_at,
          relationship: link.relationship,
        });
      }
    }
    
    console.log(`[KNOWLEDGE_LINKS] Retrieved ${lineageNodes.length} lineage nodes`);
    return lineageNodes;
  } catch (error) {
    console.error('[KNOWLEDGE_LINKS] Error getting lineage:', error);
    throw error;
  }
}

/**
 * Deletes a knowledge link from the database.
 * 
 * @param linkId - The unique identifier of the knowledge link to delete
 * @returns Promise resolving to true if the link was deleted, false otherwise
 * @throws Error if database deletion fails
 */
export async function deleteKnowledgeLink(linkId: string): Promise<boolean> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      'DELETE FROM knowledge_links WHERE id = $1 RETURNING id',
      [linkId]
    );
    
    const deleted = result.rows.length > 0;
    if (deleted) {
      console.log(`[KNOWLEDGE_LINKS] Deleted link ${linkId}`);
    }
    
    return deleted;
  } catch (error) {
    console.error('[KNOWLEDGE_LINKS] Error deleting knowledge link:', error);
    throw error;
  }
}

/**
 * Retrieves metadata for an artifact from the appropriate table.
 * This is a helper function used by getLineage to enrich lineage nodes with artifact details.
 * 
 * @param type - The type of the artifact (prompt, seed, session, file)
 * @param id - The unique identifier of the artifact
 * @returns Promise resolving to artifact metadata (title, content preview, creation date) or null if not found
 * 
 * @internal This is a private helper function used by getLineage
 */
async function getArtifactMetadata(
  type: ArtifactType,
  id: string
): Promise<{ title: string; content_preview: string; created_at: string } | null> {
  try {
    const db = await getDB();
    
    switch (type) {
      case 'prompt': {
        const result = await db.query(
          'SELECT title, content, created_at FROM prompts WHERE id = $1',
          [id]
        );
        if (result.rows.length === 0) return null;
        const row = result.rows[0] as any;
        return {
          title: row.title,
          content_preview: row.content.substring(0, 200),
          created_at: row.created_at,
        };
      }
      
      case 'seed': {
        const result = await db.query(
          'SELECT name, content, created_at FROM seeds WHERE id = $1',
          [id]
        );
        if (result.rows.length === 0) return null;
        const row = result.rows[0] as any;
        return {
          title: row.name,
          content_preview: row.content.substring(0, 200),
          created_at: row.created_at,
        };
      }
      
      case 'session': {
        const result = await db.query(
          'SELECT situation, perspectives, created_at FROM sessions WHERE id = $1',
          [id]
        );
        if (result.rows.length === 0) return null;
        const row = result.rows[0] as any;
        const perspectives = typeof row.perspectives === 'string' 
          ? JSON.parse(row.perspectives) 
          : row.perspectives;
        const preview = perspectives && perspectives.length > 0 
          ? perspectives[0].content.substring(0, 200)
          : row.situation?.substring(0, 200) || '';
        return {
          title: row.situation || 'Untitled Session',
          content_preview: preview,
          created_at: row.created_at,
        };
      }
      
      case 'file': {
        return {
          title: `File ${id}`,
          content_preview: 'File content',
          created_at: new Date().toISOString(),
        };
      }
      
      default:
        console.warn(`[KNOWLEDGE_LINKS] Unknown artifact type: ${type}`);
        return null;
    }
  } catch (error) {
    console.error(`[KNOWLEDGE_LINKS] Error getting artifact metadata for ${type}:${id}:`, error);
    return null;
  }
}
