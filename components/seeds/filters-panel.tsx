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
  principle: "bg-info/20 text-info hover:bg-info/30",
  pattern: "bg-success/20 text-success hover:bg-success/30",
  question: "bg-librarian/20 text-librarian hover:bg-librarian/30",
  route: "bg-dojo/20 text-dojo hover:bg-dojo/30",
  artifact: "bg-supervisor/20 text-supervisor hover:bg-supervisor/30",
  constraint: "bg-error/20 text-error hover:bg-error/30",
};

const STATUS_COLORS: Record<SeedStatus, string> = {
  new: "bg-muted/20 text-muted hover:bg-muted/30",
  growing: "bg-success/20 text-success hover:bg-success/30",
  mature: "bg-info/20 text-info hover:bg-info/30",
  compost: "bg-error/20 text-error hover:bg-error/30",
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
