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

const TYPE_COLORS: Record<SeedType, { active: string; inactive: string }> = {
  principle: { 
    active: "bg-info/20 text-info border-info/40", 
    inactive: "hover:bg-info/10 hover:text-info" 
  },
  pattern: { 
    active: "bg-success/20 text-success border-success/40", 
    inactive: "hover:bg-success/10 hover:text-success" 
  },
  question: { 
    active: "bg-librarian/20 text-librarian border-librarian/40", 
    inactive: "hover:bg-librarian/10 hover:text-librarian" 
  },
  route: { 
    active: "bg-dojo/20 text-dojo border-dojo/40", 
    inactive: "hover:bg-dojo/10 hover:text-dojo" 
  },
  artifact: { 
    active: "bg-supervisor/20 text-supervisor border-supervisor/40", 
    inactive: "hover:bg-supervisor/10 hover:text-supervisor" 
  },
  constraint: { 
    active: "bg-error/20 text-error border-error/40", 
    inactive: "hover:bg-error/10 hover:text-error" 
  },
};

const STATUS_COLORS: Record<SeedStatus, { active: string; inactive: string }> = {
  new: { 
    active: "bg-bg-tertiary/50 text-text-muted border-bg-tertiary", 
    inactive: "hover:bg-bg-tertiary/30 hover:text-text-secondary" 
  },
  growing: { 
    active: "bg-success/20 text-success border-success/40", 
    inactive: "hover:bg-success/10 hover:text-success" 
  },
  mature: { 
    active: "bg-info/20 text-info border-info/40", 
    inactive: "hover:bg-info/10 hover:text-info" 
  },
  compost: { 
    active: "bg-error/20 text-error border-error/40", 
    inactive: "hover:bg-error/10 hover:text-error" 
  },
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
    <aside className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2.5">
          <Filter className="h-5 w-5 text-text-accent" />
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-text-tertiary hover:text-text-primary underline underline-offset-2 transition-colors"
            aria-label="Clear all filters"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Type</h3>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((type) => {
            const isActive = filters.type?.includes(type);
            const colors = TYPE_COLORS[type];
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={cn(
                  "inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 capitalize border",
                  isActive
                    ? colors.active
                    : "bg-bg-tertiary/30 text-text-secondary border-transparent " + colors.inactive
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

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Status</h3>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status) => {
            const isActive = filters.status?.includes(status);
            const colors = STATUS_COLORS[status];
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={cn(
                  "inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 capitalize border",
                  isActive
                    ? colors.active
                    : "bg-bg-tertiary/30 text-text-secondary border-transparent " + colors.inactive
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
