'use client';

import { useMemo } from 'react';
import { useLibrary } from './useLibrary';
import type { PromptFile } from '@/lib/types';

interface UseGalleryReturn {
  prompts: PromptFile[];
  loading: boolean;
  error: string | null;
}

export function useGallery(): UseGalleryReturn {
  const { prompts: allPrompts, loading, error } = useLibrary();

  const publicPrompts = useMemo(() => {
    return allPrompts.filter((prompt) => prompt.metadata?.public === true);
  }, [allPrompts]);

  return {
    prompts: publicPrompts,
    loading,
    error,
  };
}
