import { create } from 'zustand';
import { insertSessionMessage, getSessionMessages } from '@/lib/pglite/session-messages';
import type { SessionMessageInsert } from '@/lib/dojo/types';

export type DojoMode = 'Mirror' | 'Scout' | 'Gardener' | 'Implementation';

export interface DojoMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  mode?: DojoMode;
  timestamp: number;
}

interface DojoSessionState {
  sessionId: string | null;
  messages: DojoMessage[];
  isLoading: boolean;
  currentMode: DojoMode | null;
  error: string | null;

  setSessionId: (sessionId: string) => void;
  addMessage: (message: DojoMessage) => void;
  appendToLastMessage: (content: string) => void;
  setLoading: (isLoading: boolean) => void;
  setMode: (mode: DojoMode) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;
  persistMessage: (message: DojoMessage) => Promise<void>;
  loadMessages: (sessionId: string) => Promise<void>;
}

export const useDojoStore = create<DojoSessionState>((set) => ({
  sessionId: null,
  messages: [],
  isLoading: false,
  currentMode: null,
  error: null,

  setSessionId: (sessionId) => set({ sessionId }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  appendToLastMessage: (content) => set((state) => {
    if (state.messages.length === 0) {
      return state;
    }

    const messages = [...state.messages];
    const lastMessage = messages[messages.length - 1];
    messages[messages.length - 1] = {
      ...lastMessage,
      content: lastMessage.content + content,
    };

    return { messages };
  }),

  setLoading: (isLoading) => set({ isLoading }),

  setMode: (mode) => set({ currentMode: mode }),

  setError: (error) => set({ error, isLoading: false }),

  clearSession: () => set({
    sessionId: null,
    messages: [],
    isLoading: false,
    currentMode: null,
    error: null,
  }),

  persistMessage: async (message) => {
    try {
      const sessionId = useDojoStore.getState().sessionId;
      if (!sessionId) {
        console.error('[DOJO_STORE] Cannot persist message: No active session');
        return;
      }

      const messageData: SessionMessageInsert = {
        session_id: sessionId,
        role: message.role,
        content: message.content,
        mode: message.mode,
        timestamp: new Date(message.timestamp).toISOString(),
        metadata: {},
      };

      await insertSessionMessage(messageData);
      console.log('[DOJO_STORE] Message persisted to database');
    } catch (error) {
      console.error('[DOJO_STORE] Error persisting message:', error);
    }
  },

  loadMessages: async (sessionId) => {
    try {
      set({ isLoading: true, error: null });

      const dbMessages = await getSessionMessages(sessionId);
      const messages: DojoMessage[] = dbMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        mode: msg.mode,
        timestamp: new Date(msg.timestamp).getTime(),
      }));

      set({ messages, isLoading: false });
      console.log(`[DOJO_STORE] Loaded ${messages.length} messages from database`);
    } catch (error) {
      console.error('[DOJO_STORE] Error loading messages:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load messages',
        isLoading: false 
      });
    }
  },
}));
