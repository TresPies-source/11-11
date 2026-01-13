'use client';

import { useState, useEffect } from 'react';
import type { HarnessTrace } from '@/lib/harness/types';

interface UseTraceOptions {
  traceId: string | null;
  refreshInterval?: number;
}

interface UseTraceReturn {
  data: HarnessTrace | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useTrace(options: UseTraceOptions): UseTraceReturn {
  const { traceId, refreshInterval } = options;
  const [data, setData] = useState<HarnessTrace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount((prev) => prev + 1);

  useEffect(() => {
    if (!traceId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    async function fetchTrace() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('trace_id', traceId!);

        const url = `/api/harness/trace?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - please log in');
          }
          if (response.status === 404) {
            throw new Error('Trace not found');
          }
          throw new Error('Failed to fetch trace');
        }

        const trace = await response.json();
        setData(trace);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching trace:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrace();

    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchTrace, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [traceId, retryCount, refreshInterval]);

  return {
    data,
    loading,
    error,
    retry,
  };
}
