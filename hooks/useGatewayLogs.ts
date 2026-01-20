'use client';

import { useState, useEffect } from 'react';
import { getGatewayLogs, type GatewayLogRow, type GatewayLogFilters } from '@/lib/pglite/ai-gateway-logs';

interface UseGatewayLogsOptions {
  limit?: number;
  offset?: number;
  filters?: GatewayLogFilters;
  refreshInterval?: number;
}

interface UseGatewayLogsReturn {
  logs: GatewayLogRow[];
  total: number;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useGatewayLogs(options: UseGatewayLogsOptions = {}): UseGatewayLogsReturn {
  const { limit = 50, offset = 0, filters, refreshInterval } = options;
  const [logs, setLogs] = useState<GatewayLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount((prev) => prev + 1);

  useEffect(() => {
    let isMounted = true;

    async function fetchLogs() {
      try {
        setLoading(true);
        setError(null);

        const result = await getGatewayLogs(limit, offset, filters);

        if (isMounted) {
          setLogs(result.logs);
          setTotal(result.total);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch gateway logs');
          console.error('Error fetching gateway logs:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchLogs();

    let interval: NodeJS.Timeout | undefined;
    if (refreshInterval && refreshInterval > 0) {
      interval = setInterval(fetchLogs, refreshInterval);
    }

    return () => {
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [limit, offset, filters, retryCount, refreshInterval]);

  return {
    logs,
    total,
    loading,
    error,
    retry,
  };
}
