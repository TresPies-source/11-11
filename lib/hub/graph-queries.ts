import { getDB } from '../pglite/client';
import type { GraphNode, GraphLink, GraphStats, ArtifactType } from './types';

export interface ArtifactDetails {
  type: ArtifactType;
  id: string;
  title: string;
  content_preview: string;
  created_at: string;
  updated_at?: string;
  connectionCount: number;
}

export async function getAllNodes(
  userId: string,
  limit?: number
): Promise<GraphNode[]> {
  try {
    const db = await getDB();
    const nodes: GraphNode[] = [];
    
    const maxLimit = limit ? Math.min(limit, 2000) : 2000;
    
    const promptsQuery = `
      SELECT 
        'prompt' as type,
        id::text as id,
        title,
        created_at
      FROM prompts
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const promptsResult = await db.query(promptsQuery, [userId, maxLimit]);
    
    const seedsQuery = `
      SELECT 
        'seed' as type,
        id as id,
        name as title,
        created_at
      FROM seeds
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const seedsResult = await db.query(seedsQuery, [userId, maxLimit]);
    
    const sessionsQuery = `
      SELECT 
        'session' as type,
        id::text as id,
        COALESCE(title, situation, 'Untitled Session') as title,
        created_at
      FROM sessions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const sessionsResult = await db.query(sessionsQuery, [userId, maxLimit]);
    
    for (const row of promptsResult.rows) {
      const r = row as any;
      nodes.push({
        id: r.id,
        type: 'prompt' as ArtifactType,
        title: r.title,
        created_at: r.created_at,
      });
    }
    
    for (const row of seedsResult.rows) {
      const r = row as any;
      nodes.push({
        id: r.id,
        type: 'seed' as ArtifactType,
        title: r.title,
        created_at: r.created_at,
      });
    }
    
    for (const row of sessionsResult.rows) {
      const r = row as any;
      nodes.push({
        id: r.id,
        type: 'session' as ArtifactType,
        title: r.title,
        created_at: r.created_at,
      });
    }
    
    if (limit && nodes.length > maxLimit) {
      nodes.splice(maxLimit);
    }
    
    const nodeMap = new Map<string, GraphNode>();
    nodes.forEach(node => {
      const key = `${node.type}:${node.id}`;
      nodeMap.set(key, node);
    });
    
    const linksResult = await db.query(
      `SELECT source_type, source_id, target_type, target_id
       FROM knowledge_links
       WHERE user_id = $1`,
      [userId]
    );
    
    const connectionCounts = new Map<string, number>();
    for (const link of linksResult.rows) {
      const l = link as any;
      const sourceKey = `${l.source_type}:${l.source_id}`;
      const targetKey = `${l.target_type}:${l.target_id}`;
      
      connectionCounts.set(sourceKey, (connectionCounts.get(sourceKey) || 0) + 1);
      connectionCounts.set(targetKey, (connectionCounts.get(targetKey) || 0) + 1);
    }
    
    nodes.forEach(node => {
      const key = `${node.type}:${node.id}`;
      node.connectionCount = connectionCounts.get(key) || 0;
    });
    
    console.log(`[GRAPH_QUERIES] Retrieved ${nodes.length} nodes for user ${userId}`);
    
    return nodes;
  } catch (error) {
    console.error('[GRAPH_QUERIES] Error getting all nodes:', error);
    const errorMessage = error instanceof Error 
      ? `Failed to load graph nodes: ${error.message}` 
      : 'Failed to load graph nodes: Unknown database error';
    throw new Error(errorMessage);
  }
}

export async function getAllLinks(
  userId: string
): Promise<GraphLink[]> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      `SELECT 
        source_type,
        source_id,
        target_type,
        target_id,
        relationship,
        created_at
       FROM knowledge_links
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    
    const links: GraphLink[] = result.rows.map((row: any) => ({
      source: `${row.source_type}:${row.source_id}`,
      target: `${row.target_type}:${row.target_id}`,
      relationship: row.relationship,
      created_at: row.created_at,
    }));
    
    console.log(`[GRAPH_QUERIES] Retrieved ${links.length} links for user ${userId}`);
    
    return links;
  } catch (error) {
    console.error('[GRAPH_QUERIES] Error getting all links:', error);
    const errorMessage = error instanceof Error 
      ? `Failed to load graph connections: ${error.message}` 
      : 'Failed to load graph connections: Unknown database error';
    throw new Error(errorMessage);
  }
}

export async function getGraphStats(
  userId: string
): Promise<GraphStats> {
  try {
    const db = await getDB();
    
    const promptsResult = await db.query(
      'SELECT COUNT(*) as count FROM prompts WHERE user_id = $1',
      [userId]
    );
    const promptsCount = parseInt((promptsResult.rows[0] as any).count);
    
    const seedsResult = await db.query(
      'SELECT COUNT(*) as count FROM seeds WHERE user_id = $1',
      [userId]
    );
    const seedsCount = parseInt((seedsResult.rows[0] as any).count);
    
    const sessionsResult = await db.query(
      'SELECT COUNT(*) as count FROM sessions WHERE user_id = $1',
      [userId]
    );
    const sessionsCount = parseInt((sessionsResult.rows[0] as any).count);
    
    const linksResult = await db.query(
      'SELECT COUNT(*) as count FROM knowledge_links WHERE user_id = $1',
      [userId]
    );
    const linksCount = parseInt((linksResult.rows[0] as any).count);
    
    const stats: GraphStats = {
      totalNodes: promptsCount + seedsCount + sessionsCount,
      totalLinks: linksCount,
      nodesByType: {
        prompt: promptsCount,
        seed: seedsCount,
        session: sessionsCount,
        file: 0,
      },
    };
    
    console.log(`[GRAPH_QUERIES] Stats for user ${userId}:`, stats);
    
    return stats;
  } catch (error) {
    console.error('[GRAPH_QUERIES] Error getting graph stats:', error);
    const errorMessage = error instanceof Error 
      ? `Failed to load graph statistics: ${error.message}` 
      : 'Failed to load graph statistics: Unknown database error';
    throw new Error(errorMessage);
  }
}

export async function getArtifactDetails(
  type: ArtifactType,
  id: string,
  userId: string
): Promise<ArtifactDetails | null> {
  try {
    const db = await getDB();
    let result;
    let artifact: ArtifactDetails | null = null;
    
    if (type === 'prompt') {
      result = await db.query(
        `SELECT 
          id::text as id,
          title,
          SUBSTRING(content, 1, 300) as content_preview,
          created_at,
          updated_at
        FROM prompts
        WHERE id::text = $1 AND user_id = $2`,
        [id, userId]
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0] as any;
        artifact = {
          type: 'prompt',
          id: row.id,
          title: row.title,
          content_preview: row.content_preview,
          created_at: row.created_at,
          updated_at: row.updated_at,
          connectionCount: 0,
        };
      }
    } else if (type === 'seed') {
      result = await db.query(
        `SELECT 
          id,
          name as title,
          SUBSTRING(content, 1, 300) as content_preview,
          created_at,
          updated_at
        FROM seeds
        WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0] as any;
        artifact = {
          type: 'seed',
          id: row.id,
          title: row.title,
          content_preview: row.content_preview,
          created_at: row.created_at,
          updated_at: row.updated_at,
          connectionCount: 0,
        };
      }
    } else if (type === 'session') {
      result = await db.query(
        `SELECT 
          id::text as id,
          COALESCE(title, situation, 'Untitled Session') as title,
          SUBSTRING(COALESCE(situation, ''), 1, 300) as content_preview,
          created_at,
          updated_at
        FROM sessions
        WHERE id::text = $1 AND user_id = $2`,
        [id, userId]
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0] as any;
        artifact = {
          type: 'session',
          id: row.id,
          title: row.title,
          content_preview: row.content_preview,
          created_at: row.created_at,
          updated_at: row.updated_at,
          connectionCount: 0,
        };
      }
    }
    
    if (artifact) {
      const connectionsResult = await db.query(
        `SELECT COUNT(*) as count
         FROM knowledge_links
         WHERE ((source_type = $1 AND source_id = $2) OR (target_type = $1 AND target_id = $2))
         AND user_id = $3`,
        [type, id, userId]
      );
      
      artifact.connectionCount = parseInt((connectionsResult.rows[0] as any).count);
      
      console.log(`[GRAPH_QUERIES] Retrieved artifact details for ${type}:${id}`);
    }
    
    return artifact;
  } catch (error) {
    console.error(`[GRAPH_QUERIES] Error getting artifact details for ${type}:${id}:`, error);
    const errorMessage = error instanceof Error 
      ? `Failed to load artifact details: ${error.message}` 
      : 'Failed to load artifact details: Unknown database error';
    throw new Error(errorMessage);
  }
}
