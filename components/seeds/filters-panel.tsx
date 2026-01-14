"use client";

import { memo } from "react";
import type { SeedFilters, SeedType, SeedStatus } from "@/lib/seeds/types";
import { cn } from "@/lib/utils";
import { Filter } from "lucide-react";

interface FiltersPanelProps {
  filters: SeedFilters;
  onFiltersChange: (filters: SeedFilters) => void;
}

const TYPES: SeedType[] = ["principle", "pattern", "question", "route", "artifact", "constraint"];
const STATUSES: SeedStatus[] = ["new", "growing", "mature", "compost"];

const TYPE_COLORS: Record<SeedType, string> = {
  principle: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/70",
  pattern: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/70",
  question: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/70",
  route: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/70",
  artifact: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/70",
  constraint: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/70",
};

const STATUS_COLORS: Record<SeedStatus, string> = {
  new: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
  growing: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/70",
  mature: "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/70",
  compost: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/70",
};

export const SeedFiltersPanel = memo(function SeedFiltersPanel({ filters, onFiltersChange }: FiltersPanelProps) {
  function toggleType(type: SeedType) {
    const current = filters.type || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, type: updated });
  }

  function toggleStatus(status: SeedStatus) {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    onFiltersChange({ ...filters, status: updated });
  }

  function clearAllFilters() {
    onFiltersChange({
      ...filters,
      type: undefined,
      status: undefined,
    });
  }

  const hasActiveFilters = (filters.type && filters.type.length > 0) || (filters.status && filters.status.length > 0);

  return (
    <aside className="bg-background border border-border rounded-lg p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Type</h3>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((type) => {
            const isActive = filters.type?.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={cn(
                  "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-100 active:scale-95 capitalize",
                  isActive
                    ? TYPE_COLORS[type]
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
                aria-label={`Filter by ${type}`}
                aria-pressed={isActive}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Status</h3>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status) => {
            const isActive = filters.status?.includes(status);
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={cn(
                  "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-100 active:scale-95 capitalize",
                  isActive
                    ? STATUS_COLORS[status]
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
                aria-label={`Filter by ${status}`}
                aria-pressed={isActive}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
});
