'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PromptWithCritique } from '@/lib/pglite/prompts';
import { getPublicPrompts } from '@/lib/pglite/prompts';
import { DEFAULT_USER_ID } from '@/lib/pglite/client';

interface UseGalleryReturn {
  prompts: PromptWithCritique[];
  loading: boolean;
  error: string | null;
  retry: () => void;
  filter: 'all' | 'mine';
  setFilter: (filter: 'all' | 'mine') => void;
  sort: 'recent' | 'score';
  setSort: (sort: 'recent' | 'score') => void;
}

export function useGallery(): UseGalleryReturn {
  const [prompts, setPrompts] = useState<PromptWithCritique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [sort, setSort] = useState<'recent' | 'score'>('recent');

  const fetchPublicPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const myPromptsOnly = filter === 'mine';
      const prompts = await getPublicPrompts({
        myPromptsOnly,
        userId: myPromptsOnly ? DEFAULT_USER_ID : undefined,
        sortBy: sort,
      });
      
      setPrompts(prompts || []);
    } catch (err) {
      console.error('Error fetching public prompts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch public prompts');
    } finally {
      setLoading(false);
    }
  }, [filter, sort]);

  useEffect(() => {
    fetchPublicPrompts();
  }, [fetchPublicPrompts]);

  return {
    prompts,
    loading,
    error,
    retry: fetchPublicPrompts,
    filter,
    setFilter,
    sort,
    setSort,
  };
}
