'use client';

import { useState, useEffect } from 'react';
import type { CostRecord } from '@/lib/cost/types';

interface UseCostRecordsOptions {
  limit?: number;
  offset?: number;
  operationType?: 'routing' | 'agent_execution' | 'search' | 'critique' | 'other';
}

interface UseCostRecordsReturn {
  records: CostRecord[];
  loading: boolean;
  error: string | null;
  retry: () => void;
  count: number;
}

export function useCostRecords(options: UseCostRecordsOptions = {}): UseCostRecordsReturn {
  const { limit = 10, offset = 0, operationType } = options;
  const [records, setRecords] = useState<CostRecord[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount((prev) => prev + 1);

  useEffect(() => {
    async function fetchCostRecords() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('limit', limit.toString());
        params.set('offset', offset.toString());

        const url = `/api/cost/records?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - please log in');
          }
          throw new Error('Failed to fetch cost records');
        }

        const data = await response.json();
        let filteredRecords = data.records || [];

        if (operationType) {
          filteredRecords = filteredRecords.filter(
            (record: CostRecord) => record.operation_type === operationType
          );
        }

        setRecords(filteredRecords);
        setCount(data.count || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching cost records:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCostRecords();
  }, [limit, offset, operationType, retryCount]);

  return {
    records,
    loading,
    error,
    retry,
    count,
  };
}
