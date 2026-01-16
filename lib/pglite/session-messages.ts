import { getDB } from './client';
import type { SessionMessage, SessionMessageInsert } from '../dojo/types';

/**
 * Inserts a new message into the session_messages table.
 * This function persists Dojo conversation messages for later retrieval and analysis.
 * 
 * @param message - The message data to insert (session_id, role, content, timestamp, etc.)
 * @returns Promise resolving to the created message record
 * @throws Error if database insertion fails
 * 
 * @example
 * ```ts
 * const message = await insertSessionMessage({
 *   session_id: 'abc-123',
 *   role: 'assistant',
 *   content: 'Hello! How can I help you?',
 *   timestamp: new Date().toISOString(),
 *   mode: 'dojo'
 * });
 * ```
 */
export async function insertSessionMessage(message: SessionMessageInsert): Promise<SessionMessage> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      `INSERT INTO session_messages (
        session_id, role, content, mode, timestamp, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        message.session_id,
        message.role,
        message.content,
        message.mode || null,
        message.timestamp,
        message.metadata ? JSON.stringify(message.metadata) : '{}',
      ]
    );
    
    const inserted = result.rows[0] as SessionMessage;
    console.log(`[SESSION_MESSAGES_DB] Inserted message for session ${message.session_id}`);
    return inserted;
  } catch (error) {
    console.error('[SESSION_MESSAGES_DB] Error inserting message:', error);
    throw error;
  }
}

/**
 * Retrieves all messages for a specific session, ordered chronologically.
 * 
 * @param sessionId - The unique identifier of the session
 * @returns Promise resolving to an array of messages ordered by timestamp (ASC)
 * @throws Error if database query fails
 * 
 * @example
 * ```ts
 * const messages = await getSessionMessages('abc-123');
 * // Returns: [{ id: '1', role: 'user', content: 'Hello', ... }, ...]
 * ```
 */
export async function getSessionMessages(sessionId: string): Promise<SessionMessage[]> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      'SELECT * FROM session_messages WHERE session_id = $1 ORDER BY timestamp ASC',
      [sessionId]
    );
    
    return result.rows as SessionMessage[];
  } catch (error) {
    console.error('[SESSION_MESSAGES_DB] Error getting messages:', error);
    throw error;
  }
}

/**
 * Deletes all messages for a specific session.
 * Useful for cleanup operations or when a session is deleted.
 * 
 * @param sessionId - The unique identifier of the session
 * @returns Promise resolving to the number of messages deleted
 * @throws Error if database deletion fails
 */
export async function deleteSessionMessages(sessionId: string): Promise<number> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      'DELETE FROM session_messages WHERE session_id = $1 RETURNING id',
      [sessionId]
    );
    
    const count = result.rows.length;
    if (count > 0) {
      console.log(`[SESSION_MESSAGES_DB] Deleted ${count} messages for session ${sessionId}`);
    }
    
    return count;
  } catch (error) {
    console.error('[SESSION_MESSAGES_DB] Error deleting messages:', error);
    throw error;
  }
}
