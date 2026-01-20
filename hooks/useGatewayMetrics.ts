'use client';

import { useState, useEffect } from 'react';
import { getAggregatedMetrics, type AggregatedMetrics } from '@/lib/pglite/ai-gateway-logs';

interface UseGatewayMetricsOptions {
  timeRange?: '1h' | '24h' | '7d' | '30d';
  refreshInterval?: number;
}

interface UseGatewayMetricsReturn {
  metrics: AggregatedMetrics | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useGatewayMetrics(options: UseGatewayMetricsOptions = {}): UseGatewayMetricsReturn {
  const { timeRange = '24h', refreshInterval } = options;
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount((prev) => prev + 1);

  useEffect(() => {
    let isMounted = true;

    async function fetchMetrics() {
      try {
        setLoading(true);
        setError(null);

        const data = await getAggregatedMetrics(timeRange);

        if (isMounted) {
          setMetrics(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
          console.error('Error fetching gateway metrics:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchMetrics();

    let interval: NodeJS.Timeout | undefined;
    if (refreshInterval && refreshInterval > 0) {
      interval = setInterval(fetchMetrics, refreshInterval);
    }

    return () => {
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timeRange, retryCount, refreshInterval]);

  return {
    metrics,
    loading,
    error,
    retry,
  };
}
