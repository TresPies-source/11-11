'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Suggestion, SuggestionsResponse } from '@/lib/librarian/suggestions';

interface UseSuggestionsOptions {
  promptId?: string;
  trigger?: 'manual' | 'prompt_save' | 'dojo_session' | 'page_load';
  limit?: number;
  autoLoad?: boolean;
  includeTypes?: string[];
}

interface UseSuggestionsReturn {
  suggestions: Suggestion[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  dismiss: (targetId: string) => void;
}

export function useSuggestions(
  options: UseSuggestionsOptions = {}
): UseSuggestionsReturn {
  const {
    promptId,
    trigger = 'page_load',
    limit = 8,
    autoLoad = true,
    includeTypes,
  } = options;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (promptId) params.append('prompt_id', promptId);
      if (trigger) params.append('trigger', trigger);
      if (limit) params.append('limit', limit.toString());
      if (includeTypes) params.append('include_types', includeTypes.join(','));

      const response = await fetch(`/api/librarian/suggestions?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load suggestions' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SuggestionsResponse = await response.json();
      
      const filteredSuggestions = data.suggestions.filter(
        (s) => !dismissedIds.has(s.target_id)
      );
      
      setSuggestions(filteredSuggestions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while loading suggestions';
      setError(errorMessage);
      setSuggestions([]);
      console.error('Suggestions error:', err);
    } finally {
      setLoading(false);
    }
  }, [promptId, trigger, limit, includeTypes, dismissedIds]);

  const dismiss = useCallback((targetId: string) => {
    setDismissedIds((prev) => new Set(prev).add(targetId));
    setSuggestions((prev) => prev.filter((s) => s.target_id !== targetId));
  }, []);

  useEffect(() => {
    if (autoLoad) {
      fetchSuggestions();
    }
  }, [autoLoad, fetchSuggestions]);

  return {
    suggestions,
    loading,
    error,
    refresh: fetchSuggestions,
    dismiss,
  };
}
