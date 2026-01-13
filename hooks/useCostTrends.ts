'use client';

import { useState, useEffect } from 'react';

export interface CostTrend {
  date: string;
  total_tokens: number;
  total_cost: number;
}

interface UseCostTrendsOptions {
  days?: number;
}

interface UseCostTrendsReturn {
  trends: CostTrend[];
  loading: boolean;
  error: string | null;
  retry: () => void;
  count: number;
}

export function useCostTrends(options: UseCostTrendsOptions = {}): UseCostTrendsReturn {
  const { days = 30 } = options;
  const [trends, setTrends] = useState<CostTrend[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount((prev) => prev + 1);

  useEffect(() => {
    async function fetchCostTrends() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('days', days.toString());

        const url = `/api/cost/trends?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - please log in');
          }
          throw new Error('Failed to fetch cost trends');
        }

        const data = await response.json();
        setTrends(data.trends || []);
        setCount(data.count || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching cost trends:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCostTrends();
  }, [days, retryCount]);

  return {
    trends,
    loading,
    error,
    retry,
    count,
  };
}
