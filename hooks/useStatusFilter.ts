"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { PromptStatus } from "@/lib/pglite/types";

export type StatusFilterValue = PromptStatus | 'all';

export interface StatusFilterState {
  currentFilter: StatusFilterValue;
  setFilter: (status: StatusFilterValue) => void;
  clearFilter: () => void;
}

export function useStatusFilter(): StatusFilterState {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentFilter = useMemo(() => {
    const status = searchParams.get('status');
    if (!status) return 'all';
    if (status === 'draft' || status === 'active' || status === 'saved' || status === 'archived') {
      return status as PromptStatus;
    }
    return 'all';
  }, [searchParams]);

  const setFilter = useCallback((status: StatusFilterValue) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (status === 'all') {
      params.delete('status');
    } else {
      params.set('status', status);
    }

    const query = params.toString();
    const newUrl = query ? `?${query}` : window.location.pathname;
    router.push(newUrl);
  }, [searchParams, router]);

  const clearFilter = useCallback(() => {
    setFilter('all');
  }, [setFilter]);

  return {
    currentFilter,
    setFilter,
    clearFilter,
  };
}
