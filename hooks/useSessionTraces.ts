'use client';

import { useState, useEffect } from 'react';
import type { HarnessTrace } from '@/lib/harness/types';

interface UseSessionTracesOptions {
  sessionId: string | null;
}

interface UseSessionTracesReturn {
  traces: HarnessTrace[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useSessionTraces(options: UseSessionTracesOptions): UseSessionTracesReturn {
  const { sessionId } = options;
  const [traces, setTraces] = useState<HarnessTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount((prev) => prev + 1);

  useEffect(() => {
    if (!sessionId) {
      setTraces([]);
      setLoading(false);
      setError(null);
      return;
    }

    async function fetchSessionTraces() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('session_id', sessionId!);

        const url = `/api/harness/session?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - please log in');
          }
          throw new Error('Failed to fetch session traces');
        }

        const data = await response.json();
        setTraces(data.traces || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching session traces:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSessionTraces();
  }, [sessionId, retryCount]);

  return {
    traces,
    loading,
    error,
    retry,
  };
}
