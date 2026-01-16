"use client";

import { useState, useCallback, useEffect } from "react";
import type { FeedFilters, ArtifactType } from "@/lib/hub/types";

const STORAGE_KEY = "hub-feed-filters";

const DEFAULT_FILTERS: FeedFilters = {
  types: [],
  dateFrom: null,
  dateTo: null,
  search: "",
};

function loadFiltersFromStorage(): FeedFilters {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_FILTERS;
    
    const parsed = JSON.parse(stored);
    return {
      types: Array.isArray(parsed.types) ? parsed.types : DEFAULT_FILTERS.types,
      dateFrom: parsed.dateFrom || DEFAULT_FILTERS.dateFrom,
      dateTo: parsed.dateTo || DEFAULT_FILTERS.dateTo,
      search: typeof parsed.search === "string" ? parsed.search : DEFAULT_FILTERS.search,
    };
  } catch (error) {
    console.error("Failed to load filters from localStorage:", error);
    return DEFAULT_FILTERS;
  }
}

function saveFiltersToStorage(filters: FeedFilters): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error("Failed to save filters to localStorage:", error);
  }
}

export interface UseFiltersReturn {
  filters: FeedFilters;
  updateTypes: (types: ArtifactType[]) => void;
  updateDateRange: (dateFrom: string | null, dateTo: string | null) => void;
  updateSearch: (search: string) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

export function useFilters(): UseFiltersReturn {
  const [filters, setFilters] = useState<FeedFilters>(DEFAULT_FILTERS);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loaded = loadFiltersFromStorage();
    setFilters(loaded);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      saveFiltersToStorage(filters);
    }
  }, [filters, isInitialized]);

  const updateTypes = useCallback((types: ArtifactType[]) => {
    setFilters((prev) => ({ ...prev, types }));
  }, []);

  const updateDateRange = useCallback((dateFrom: string | null, dateTo: string | null) => {
    setFilters((prev) => ({ ...prev, dateFrom, dateTo }));
  }, []);

  const updateSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = 
    filters.types.length > 0 ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.search.trim() !== "";

  return {
    filters,
    updateTypes,
    updateDateRange,
    updateSearch,
    resetFilters,
    hasActiveFilters,
  };
}
