import { DojoMode } from '@/lib/stores/dojo.store';

/**
 * Represents a persisted message from a Dojo conversation session.
 * Messages are stored in the session_messages table for later retrieval and extraction.
 */
export interface SessionMessage {
  id: string;
  session_id: string;
  role: 'user' | 'agent';
  content: string;
  mode?: DojoMode;
  timestamp: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Data required to persist a new Dojo message to the database.
 * Omits auto-generated fields (id, created_at).
 */
export interface SessionMessageInsert {
  session_id: string;
  role: 'user' | 'agent';
  content: string;
  mode?: DojoMode;
  timestamp: string;
  metadata?: Record<string, any>;
}
