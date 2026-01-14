'use client';

import { useState, useEffect } from 'react';
import { getSeeds } from '@/lib/pglite/seeds';
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

        const data = await getSeeds(filters);
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
