'use client';

import { useState, useEffect } from 'react';
import type { HarnessTrace } from '@/lib/harness/types';

interface UseUserTracesOptions {
  userId?: string | null;
  limit?: number;
}

interface UseUserTracesReturn {
  traces: HarnessTrace[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useUserTraces(options: UseUserTracesOptions = {}): UseUserTracesReturn {
  const { userId, limit = 10 } = options;
  const [traces, setTraces] = useState<HarnessTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount((prev) => prev + 1);

  useEffect(() => {
    async function fetchUserTraces() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (userId) {
          params.set('user_id', userId);
        }
        params.set('limit', limit.toString());

        const url = `/api/harness/user?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - please log in');
          }
          throw new Error('Failed to fetch user traces');
        }

        const data = await response.json();
        setTraces(data.traces || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching user traces:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserTraces();
  }, [userId, limit, retryCount]);

  return {
    traces,
    loading,
    error,
    retry,
  };
}
