import { useCallback, useEffect } from 'react';
import { useDojoStore, DojoMessage, DojoMode } from '@/lib/stores/dojo.store';
import { HarnessEvent } from '@/lib/harness/types';

interface UseDojo {
  sendMessage: (situation: string, perspectives?: string[]) => Promise<void>;
  messages: DojoMessage[];
  isLoading: boolean;
  error: string | null;
}

export function useDojo(sessionId: string): UseDojo {
  const {
    messages,
    isLoading,
    error,
    setSessionId,
    addMessage,
    appendToLastMessage,
    setLoading,
    setMode,
    setError,
  } = useDojoStore();

  useEffect(() => {
    setSessionId(sessionId);
  }, [sessionId, setSessionId]);

  const sendMessage = useCallback(async (situation: string, perspectives: string[] = []) => {
    if (isLoading) {
      console.warn('Request already in progress, ignoring duplicate call');
      return;
    }

    setLoading(true);
    setError(null);

    const userMessage: DojoMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: situation,
      timestamp: Date.now(),
    };

    addMessage(userMessage);

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let agentMessageStarted = false;

    try {
      const response = await fetch('/api/dojo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          situation,
          perspectives: perspectives.filter(p => p.trim().length > 0),
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null - streaming not supported');
      }

      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            if (buffer.trim()) {
              try {
                const event = JSON.parse(buffer) as HarnessEvent;
                handleEvent(event);
              } catch (parseError) {
                console.error('Failed to parse final buffered event:', parseError);
              }
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            try {
              const event = JSON.parse(trimmedLine) as HarnessEvent;
              handleEvent(event);
            } catch (parseError) {
              console.error('Failed to parse event line:', trimmedLine, parseError);
            }
          }
        }
      } catch (streamError) {
        if (streamError instanceof Error && streamError.name === 'AbortError') {
          throw new Error('Request was cancelled');
        }
        throw new Error(`Stream error: ${streamError instanceof Error ? streamError.message : 'Unknown stream error'}`);
      }
    } catch (err) {
      let errorMessage = 'Unknown error occurred';
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = 'Network error - please check your connection';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      console.error('[useDojo] Error:', err);
      setError(errorMessage);
    } finally {
      if (reader) {
        try {
          await reader.cancel();
        } catch (cancelError) {
          console.error('Failed to cancel reader:', cancelError);
        }
      }
      setLoading(false);
    }

    function handleEvent(event: HarnessEvent) {
      switch (event.event_type) {
        case 'MODE_TRANSITION':
          const mode = event.outputs.mode as DojoMode;
          setMode(mode);
          break;

        case 'AGENT_RESPONSE':
        case 'AGENT_ACTIVITY_PROGRESS':
          const content = event.outputs.content || event.outputs.chunk || '';
          if (content) {
            if (!agentMessageStarted) {
              const agentMessage: DojoMessage = {
                id: crypto.randomUUID(),
                role: 'agent',
                content,
                mode: useDojoStore.getState().currentMode || undefined,
                timestamp: Date.now(),
              };
              addMessage(agentMessage);
              agentMessageStarted = true;
            } else {
              appendToLastMessage(content);
            }
          }
          break;

        case 'ERROR':
          const errorMsg = event.metadata.error_message || 'An error occurred';
          setError(errorMsg);
          break;
      }
    }
  }, [isLoading, addMessage, appendToLastMessage, setLoading, setMode, setError, sessionId]);

  return {
    sendMessage,
    messages,
    isLoading,
    error,
  };
}
