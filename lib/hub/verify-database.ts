import { getDB } from '@/lib/pglite/client';

/**
 * Database row structure for knowledge_links table.
 * Used for verification and debugging queries.
 */
export interface KnowledgeLinkRow {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relationship: string;
  user_id: string;
  created_at: string;
}

/**
 * Database row structure for session_messages table.
 * Used for verification and debugging queries.
 */
export interface SessionMessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  timestamp: string;
  metadata: any;
}

/**
 * Statistics for relationship distribution across knowledge links.
 * Groups links by relationship type, source type, and target type.
 */
export interface RelationshipStats {
  relationship: string;
  source_type: string;
  target_type: string;
  count: number;
}

/**
 * Retrieves the 10 most recent knowledge links from the database.
 * Used for verification that links are being created correctly.
 * 
 * @returns Promise resolving to an array of recent knowledge link rows
 */
export async function verifyKnowledgeLinks(): Promise<KnowledgeLinkRow[]> {
  const db = await getDB();
  const result = await db.query<KnowledgeLinkRow>(
    'SELECT * FROM knowledge_links ORDER BY created_at DESC LIMIT 10'
  );
  return result.rows;
}

/**
 * Retrieves the 10 most recent session messages from the database.
 * Used for verification that Dojo messages are persisting correctly.
 * 
 * @returns Promise resolving to an array of recent session message rows
 */
export async function verifySessionMessages(): Promise<SessionMessageRow[]> {
  const db = await getDB();
  const result = await db.query<SessionMessageRow>(
    'SELECT * FROM session_messages ORDER BY timestamp DESC LIMIT 10'
  );
  return result.rows;
}

/**
 * Aggregates knowledge link statistics grouped by relationship and artifact types.
 * Useful for understanding how different types of artifacts are connected.
 * 
 * @returns Promise resolving to an array of relationship statistics
 */
export async function verifyRelationshipDistribution(): Promise<RelationshipStats[]> {
  const db = await getDB();
  const result = await db.query<RelationshipStats>(`
    SELECT 
      relationship,
      source_type,
      target_type,
      COUNT(*) as count
    FROM knowledge_links
    GROUP BY relationship, source_type, target_type
    ORDER BY count DESC
  `);
  return result.rows;
}

/**
 * Retrieves all knowledge links from the database ordered by creation date.
 * Used for comprehensive data inspection and debugging.
 * 
 * @returns Promise resolving to all knowledge link rows
 */
export async function getAllKnowledgeLinks(): Promise<KnowledgeLinkRow[]> {
  const db = await getDB();
  const result = await db.query<KnowledgeLinkRow>(
    'SELECT * FROM knowledge_links ORDER BY created_at DESC'
  );
  return result.rows;
}

/**
 * Retrieves all session messages from the database ordered by timestamp.
 * Used for comprehensive message inspection and debugging.
 * 
 * @returns Promise resolving to all session message rows
 */
export async function getAllSessionMessages(): Promise<SessionMessageRow[]> {
  const db = await getDB();
  const result = await db.query<SessionMessageRow>(
    'SELECT * FROM session_messages ORDER BY timestamp DESC'
  );
  return result.rows;
}
