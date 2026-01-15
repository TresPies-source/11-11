import { useState, useCallback } from 'react';
import { useAgentStore } from '@/lib/stores/agent.store';
import { HarnessEvent } from '@/lib/harness/types';

interface UseSupervisorReturn {
  run: (prompt: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useSupervisor(): UseSupervisorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { startRun, addTraceEvent, endRun, setError: setStoreError } = useAgentStore();

  const run = useCallback(async (prompt: string) => {
    if (isLoading) {
      console.warn('Run already in progress, ignoring duplicate call');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const sessionId = crypto.randomUUID();
    startRun(sessionId);

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      const response = await fetch('/api/supervisor/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          query: prompt,
          conversation_context: [],
          session_id: sessionId,
          stream: true,
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
                addTraceEvent(event);
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
              addTraceEvent(event);
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

      endRun();
    } catch (err) {
      let errorMessage = 'Unknown error occurred';
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = 'Network error - please check your connection';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      console.error('[useSupervisor] Error:', err);
      setError(errorMessage);
      setStoreError(errorMessage);
    } finally {
      if (reader) {
        try {
          await reader.cancel();
        } catch (cancelError) {
          console.error('Failed to cancel reader:', cancelError);
        }
      }
      endRun();
      setIsLoading(false);
    }
  }, [isLoading, startRun, addTraceEvent, endRun, setStoreError]);

  return {
    run,
    isLoading,
    error,
  };
}
