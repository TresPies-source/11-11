'use client';

import { useState, useEffect } from 'react';
import { getLineage } from '@/lib/pglite/knowledge-links';
import type { ArtifactType, LineageNode } from '@/lib/hub/types';

interface UseLineageOptions {
  type: ArtifactType;
  id: string;
  enabled?: boolean;
}

interface UseLineageReturn {
  lineage: LineageNode[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  count: number;
}

// Dev mode detection
const isDevMode = () => {
  if (typeof window === 'undefined') return false;
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true';
};

export function useLineage(options: UseLineageOptions): UseLineageReturn {
  const { type, id, enabled = true } = options;
  const [lineage, setLineage] = useState<LineageNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const refetch = () => setRetryCount((prev) => prev + 1);

  useEffect(() => {
    if (!enabled) {
      setLineage([]);
      setLoading(false);
      setError(null);
      return;
    }

    async function fetchLineage() {
      try {
        setLoading(true);
        setError(null);

        // Call getLineage directly (client-side PGlite access)
        // In dev mode, use mock user ID; in production, get from auth context
        const userId = isDevMode() ? 'dev@11-11.dev' : 'user@example.com';
        const lineageNodes = await getLineage(type, id, userId);
        
        setLineage(lineageNodes);
        console.log(`[useLineage] Loaded ${lineageNodes.length} lineage nodes for ${type}:${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching lineage:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLineage();
  }, [type, id, enabled, retryCount]);

  return {
    lineage,
    loading,
    error,
    refetch,
    count: lineage.length,
  };
}
