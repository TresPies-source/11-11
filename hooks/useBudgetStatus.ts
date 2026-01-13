'use client';

import { useState, useEffect } from 'react';

export interface BudgetStatus {
  query_limit: number;
  session_limit: number;
  user_monthly_limit: number;
  query_usage: number;
  session_usage: number;
  user_monthly_usage: number;
  warnings: string[];
  total_cost_this_month: number;
}

interface UseBudgetStatusOptions {
  sessionId?: string | null;
  refreshInterval?: number;
}

interface UseBudgetStatusReturn {
  data: BudgetStatus | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useBudgetStatus(options: UseBudgetStatusOptions = {}): UseBudgetStatusReturn {
  const { sessionId, refreshInterval } = options;
  const [data, setData] = useState<BudgetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount((prev) => prev + 1);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchBudgetStatus() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (sessionId) {
          params.set('session_id', sessionId);
        }

        const url = `/api/cost/budget${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - please log in');
          }
          throw new Error('Failed to fetch budget status');
        }

        const budgetData = await response.json();
        setData(budgetData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching budget status:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBudgetStatus();

    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(fetchBudgetStatus, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [sessionId, refreshInterval, retryCount]);

  return {
    data,
    loading,
    error,
    retry,
  };
}
