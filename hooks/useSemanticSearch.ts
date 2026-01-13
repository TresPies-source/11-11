'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import type { SearchResult, SearchResponse, SearchFilters } from '@/lib/librarian/search';

interface UseSemanticSearchOptions {
  debounceMs?: number;
  autoSearch?: boolean;
  defaultFilters?: SearchFilters;
}

interface UseSemanticSearchReturn {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  query: string;
  filters: SearchFilters;
  count: number;
  duration: number;
  setQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
  search: (searchQuery?: string) => Promise<void>;
  clearResults: () => void;
}

export function useSemanticSearch(
  options: UseSemanticSearchOptions = {}
): UseSemanticSearchReturn {
  const { 
    debounceMs = 300, 
    autoSearch = true,
    defaultFilters = {} 
  } = options;

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [duration, setDuration] = useState(0);

  const debouncedQuery = useDebounce(query, debounceMs);

  const search = useCallback(async (searchQuery?: string) => {
    const queryToSearch = searchQuery ?? query;
    
    if (!queryToSearch.trim()) {
      setResults([]);
      setCount(0);
      setDuration(0);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/librarian/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryToSearch,
          ...filters,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Search failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
      setCount(data.count);
      setDuration(data.duration_ms);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while searching';
      setError(errorMessage);
      setResults([]);
      setCount(0);
      setDuration(0);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  const clearResults = useCallback(() => {
    setQuery('');
    setResults([]);
    setCount(0);
    setDuration(0);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    query,
    filters,
    count,
    duration,
    setQuery,
    setFilters,
    search,
    clearResults,
  };
}
