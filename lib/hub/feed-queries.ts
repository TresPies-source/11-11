import { getDB } from '../pglite/client';
import type { FeedArtifact, FeedFilters, FeedResponse, ArtifactType } from './types';

interface PaginationOptions {
  page: number;
  limit: number;
}

export async function getFeedArtifacts(
  userId: string,
  filters: FeedFilters,
  pagination: PaginationOptions
): Promise<FeedResponse> {
  try {
    const db = await getDB();
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    
    const params: any[] = [userId];
    let paramIndex = 2;
    
    const typeClauses: string[] = [];
    
    if (filters.types.length === 0 || filters.types.includes('prompt')) {
      let whereClause = `user_id = $1`;
      
      if (filters.dateFrom) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(filters.dateFrom);
        paramIndex++;
      }
      
      if (filters.dateTo) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(filters.dateTo);
        paramIndex++;
      }
      
      if (filters.search) {
        whereClause += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }
      
      typeClauses.push(`
        SELECT 
          'prompt' as type,
          id::text as id,
          title,
          SUBSTRING(content, 1, 200) as content_preview,
          created_at,
          updated_at,
          GREATEST(created_at, updated_at) as last_activity
        FROM prompts
        WHERE ${whereClause}
      `);
    }
    
    if (filters.types.length === 0 || filters.types.includes('seed')) {
      let whereClause = `user_id = $1`;
      
      if (filters.dateFrom) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(filters.dateFrom);
        paramIndex++;
      }
      
      if (filters.dateTo) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(filters.dateTo);
        paramIndex++;
      }
      
      if (filters.search) {
        whereClause += ` AND (name ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }
      
      typeClauses.push(`
        SELECT 
          'seed' as type,
          id as id,
          name as title,
          SUBSTRING(content, 1, 200) as content_preview,
          created_at,
          updated_at,
          GREATEST(created_at, updated_at) as last_activity
        FROM seeds
        WHERE ${whereClause}
      `);
    }
    
    if (filters.types.length === 0 || filters.types.includes('session')) {
      let whereClause = `user_id = $1`;
      
      if (filters.dateFrom) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(filters.dateFrom);
        paramIndex++;
      }
      
      if (filters.dateTo) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(filters.dateTo);
        paramIndex++;
      }
      
      if (filters.search) {
        whereClause += ` AND (situation ILIKE $${paramIndex} OR title ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }
      
      typeClauses.push(`
        SELECT 
          'session' as type,
          id::text as id,
          COALESCE(title, situation, 'Untitled Session') as title,
          SUBSTRING(COALESCE(situation, ''), 1, 200) as content_preview,
          created_at,
          updated_at,
          GREATEST(created_at, updated_at) as last_activity
        FROM sessions
        WHERE ${whereClause}
      `);
    }
    
    if (typeClauses.length === 0) {
      return {
        artifacts: [],
        pagination: {
          page,
          limit,
          total: 0,
          hasMore: false,
        },
      };
    }
    
    const unionQuery = typeClauses.join(' UNION ALL ');
    
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM (${unionQuery}) as combined`,
      params
    );
    const total = parseInt((countResult.rows[0] as any).total);
    
    const dataQuery = `
      SELECT * FROM (${unionQuery}) as combined
      ORDER BY last_activity DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);
    
    const result = await db.query(dataQuery, params);
    
    const artifacts: FeedArtifact[] = await Promise.all(
      result.rows.map(async (row: any) => {
        const connectionCount = await getArtifactConnectionCount(
          row.type as ArtifactType,
          row.id,
          userId
        );
        
        return {
          type: row.type,
          id: row.id,
          title: row.title,
          content_preview: row.content_preview,
          created_at: row.created_at,
          updated_at: row.updated_at,
          last_activity: row.last_activity,
          connection_count: connectionCount,
        };
      })
    );
    
    console.log(`[FEED_QUERIES] Retrieved ${artifacts.length} artifacts (page ${page}/${Math.ceil(total / limit)})`);
    
    return {
      artifacts,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + artifacts.length < total,
      },
    };
  } catch (error) {
    console.error('[FEED_QUERIES] Error getting feed artifacts:', error);
    const errorMessage = error instanceof Error 
      ? `Failed to load feed: ${error.message}` 
      : 'Failed to load feed: Unknown database error';
    throw new Error(errorMessage);
  }
}

export async function getArtifactConnectionCount(
  type: ArtifactType,
  id: string,
  userId: string
): Promise<number> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      `SELECT COUNT(*) as count
       FROM knowledge_links
       WHERE ((source_type = $1 AND source_id = $2) OR (target_type = $1 AND target_id = $2))
       AND user_id = $3`,
      [type, id, userId]
    );
    
    return parseInt((result.rows[0] as any).count);
  } catch (error) {
    console.error(`[FEED_QUERIES] Error counting connections for ${type}:${id}:`, error);
    return 0;
  }
}
