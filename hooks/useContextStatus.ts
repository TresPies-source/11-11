'use client';

import { useState, useEffect } from 'react';
import type { ContextSnapshot, TierBreakdown, PruningStrategy } from '@/lib/context/types';

export interface ContextStatus {
  sessionId: string;
  tierBreakdown: TierBreakdown;
  totalTokens: number;
  budgetPercent: number;
  pruningStrategy: PruningStrategy;
  createdAt: string;
}

interface UseContextStatusOptions {
  sessionId?: string | null;
  refreshInterval?: number;
}

interface UseContextStatusReturn {
  data: ContextStatus | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useContextStatus(options: UseContextStatusOptions = {}): UseContextStatusReturn {
  const { sessionId, refreshInterval } = options;
  const [data, setData] = useState<ContextStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount((prev) => prev + 1);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchContextStatus() {
      try {
        setLoading(true);
        setError(null);

        if (!sessionId) {
          setData(null);
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();
        params.set('session_id', sessionId);
        params.set('mode', 'current');

        const url = `/api/context/status?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            setData(null);
            setLoading(false);
            return;
          }
          if (response.status === 401) {
            throw new Error('Unauthorized - please log in');
          }
          throw new Error('Failed to fetch context status');
        }

        const snapshot: ContextSnapshot = await response.json();
        
        setData({
          sessionId: snapshot.session_id,
          tierBreakdown: snapshot.tier_breakdown,
          totalTokens: snapshot.total_tokens,
          budgetPercent: snapshot.budget_percent,
          pruningStrategy: snapshot.pruning_strategy,
          createdAt: snapshot.created_at,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching context status:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchContextStatus();

    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(fetchContextStatus, refreshInterval);
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

interface UseRecentSnapshotsOptions {
  limit?: number;
}

interface UseRecentSnapshotsReturn {
  snapshots: ContextSnapshot[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useRecentSnapshots(options: UseRecentSnapshotsOptions = {}): UseRecentSnapshotsReturn {
  const { limit = 10 } = options;
  const [snapshots, setSnapshots] = useState<ContextSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount((prev) => prev + 1);

  useEffect(() => {
    async function fetchRecentSnapshots() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('mode', 'recent');
        params.set('limit', limit.toString());

        const url = `/api/context/status?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - please log in');
          }
          throw new Error('Failed to fetch recent snapshots');
        }

        const data = await response.json();
        setSnapshots(data.snapshots || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching recent snapshots:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentSnapshots();
  }, [limit, retryCount]);

  return {
    snapshots,
    loading,
    error,
    retry,
  };
}
