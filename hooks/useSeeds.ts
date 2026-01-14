'use client';

import { useState, useEffect } from 'react';
import type { SeedRow, SeedFilters } from '@/lib/seeds/types';

interface UseSeedsOptions {
  filters?: SeedFilters;
  enabled?: boolean;
}

interface UseSeedsReturn {
  seeds: SeedRow[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSeeds(options: UseSeedsOptions = {}): UseSeedsReturn {
  const { filters = {}, enabled = true } = options;
  const [seeds, setSeeds] = useState<SeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const refetch = () => setRetryCount((prev) => prev + 1);

  useEffect(() => {
    if (!enabled) {
      setSeeds([]);
      setLoading(false);
      setError(null);
      return;
    }

    async function fetchSeeds() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        
        if (filters.status && filters.status.length > 0) {
          params.set('status', filters.status.join(','));
        }
        
        if (filters.type && filters.type.length > 0) {
          params.set('type', filters.type.join(','));
        }
        
        if (filters.search) {
          params.set('search', filters.search);
        }
        
        if (filters.dateFrom) {
          params.set('dateFrom', filters.dateFrom);
        }
        
        if (filters.dateTo) {
          params.set('dateTo', filters.dateTo);
        }
        
        if (filters.user_id) {
          params.set('user_id', filters.user_id);
        }
        
        if (filters.session_id) {
          params.set('session_id', filters.session_id);
        }

        const url = `/api/seeds${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - please log in');
          }
          if (response.status === 404) {
            throw new Error('Seeds not found');
          }
          throw new Error('Failed to fetch seeds');
        }

        const data = await response.json();
        setSeeds(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching seeds:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSeeds();
  }, [
    enabled,
    filters.status?.join(','),
    filters.type?.join(','),
    filters.search,
    filters.dateFrom,
    filters.dateTo,
    filters.user_id,
    filters.session_id,
    retryCount,
  ]);

  return {
    seeds,
    loading,
    error,
    refetch,
  };
}
