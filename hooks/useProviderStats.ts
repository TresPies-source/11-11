'use client';

import { useState, useEffect } from 'react';
import { getProviderStats, type ProviderStats } from '@/lib/pglite/ai-gateway-logs';

interface UseProviderStatsOptions {
  timeRange?: '1h' | '24h' | '7d' | '30d';
  refreshInterval?: number;
}

interface UseProviderStatsReturn {
  stats: ProviderStats[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useProviderStats(options: UseProviderStatsOptions = {}): UseProviderStatsReturn {
  const { timeRange = '24h', refreshInterval } = options;
  const [stats, setStats] = useState<ProviderStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount((prev) => prev + 1);

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        const data = await getProviderStats(timeRange);

        if (isMounted) {
          setStats(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch provider stats');
          console.error('Error fetching provider stats:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    let interval: NodeJS.Timeout | undefined;
    if (refreshInterval && refreshInterval > 0) {
      interval = setInterval(fetchStats, refreshInterval);
    }

    return () => {
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timeRange, retryCount, refreshInterval]);

  return {
    stats,
    loading,
    error,
    retry,
  };
}
