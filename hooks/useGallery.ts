'use client';

import { useMemo } from 'react';
import { useLibrary } from './useLibrary';
import type { PromptFile } from '@/lib/types';

interface UseGalleryReturn {
  prompts: PromptFile[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useGallery(): UseGalleryReturn {
  const { prompts: allPrompts, loading, error, retry } = useLibrary();

  const publicPrompts = useMemo(() => {
    return allPrompts.filter((prompt) => prompt.metadata?.public === true);
  }, [allPrompts]);

  return {
    prompts: publicPrompts,
    loading,
    error,
    retry,
  };
}
