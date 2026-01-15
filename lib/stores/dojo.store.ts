import { create } from 'zustand';

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
}));
