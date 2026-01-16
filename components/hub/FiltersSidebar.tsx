"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Search, X, Filter, MessageSquare, FileText, Sprout, File } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArtifactType } from "@/lib/hub/types";
import type { UseFiltersReturn } from "@/hooks/hub/useFilters";

interface FiltersSidebarProps {
  filters: UseFiltersReturn;
  className?: string;
}

const ARTIFACT_TYPES: Array<{ type: ArtifactType; label: string; icon: typeof MessageSquare }> = [
  { type: "session", label: "Sessions", icon: MessageSquare },
  { type: "prompt", label: "Prompts", icon: FileText },
  { type: "seed", label: "Seeds", icon: Sprout },
  { type: "file", label: "Files", icon: File },
];

const DATE_PRESETS = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

export const FiltersSidebar = memo(function FiltersSidebar({ filters, className }: FiltersSidebarProps) {
  const [searchInput, setSearchInput] = useState(filters.filters.search);
  const [customDateRange, setCustomDateRange] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      filters.updateSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters]);

  const handleTypeToggle = useCallback((type: ArtifactType) => {
    const currentTypes = filters.filters.types;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    filters.updateTypes(newTypes);
  }, [filters]);

  const handleDatePreset = useCallback((days: number) => {
    setCustomDateRange(false);
    if (days === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filters.updateDateRange(today.toISOString(), tomorrow.toISOString());
    } else {
      const now = new Date();
      const past = new Date();
      past.setDate(past.getDate() - days);
      filters.updateDateRange(past.toISOString(), now.toISOString());
    }
  }, [filters]);

  const handleCustomDateChange = useCallback((field: "from" | "to", value: string) => {
    setCustomDateRange(true);
    if (field === "from") {
      const date = value ? new Date(value).toISOString() : null;
      filters.updateDateRange(date, filters.filters.dateTo);
    } else {
      const date = value ? new Date(value).toISOString() : null;
      filters.updateDateRange(filters.filters.dateFrom, date);
    }
  }, [filters]);

  const getActiveFilterCount = useCallback((): number => {
    let count = 0;
    if (filters.filters.types.length > 0) count += filters.filters.types.length;
    if (filters.filters.dateFrom || filters.filters.dateTo) count += 1;
    if (filters.filters.search.trim() !== "") count += 1;
    return count;
  }, [filters.filters]);

  const formatDateForInput = useCallback((isoString: string | null): string => {
    if (!isoString) return "";
    return isoString.split("T")[0];
  }, []);

  const activeCount = getActiveFilterCount();

  return (
    <aside className={cn("flex flex-col gap-6 p-4 bg-bg-secondary border-r border-bg-tertiary", className)} role="search" aria-label="Filter knowledge artifacts">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-secondary" aria-hidden="true" />
            <h2 id="filters-heading" className="text-sm font-semibold text-text-primary">Filters</h2>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-text-accent/10 text-text-accent" aria-label={`${activeCount} active filters`}>
                {activeCount}
              </span>
            )}
          </div>
          {filters.hasActiveFilters && (
            <button
              onClick={filters.resetFilters}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-text-accent focus:ring-offset-2 rounded px-2 py-1"
              aria-label="Clear all filters"
            >
              Clear All
            </button>
          )}
        </div>
        <p id="filters-description" className="text-xs text-text-secondary">
          Narrow down your knowledge feed by type, date, or search terms.
        </p>
      </div>

      <div>
        <label htmlFor="search-input" className="block text-xs font-medium text-text-secondary mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" aria-hidden="true" />
          <input
            id="search-input"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search artifacts..."
            aria-describedby="filters-description"
            className="w-full pl-9 pr-9 py-2 bg-bg-tertiary border border-bg-elevated rounded-lg focus:outline-none focus:ring-2 focus:border-text-accent focus:ring-text-accent transition-colors text-sm text-text-primary placeholder:text-text-muted"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-text-accent rounded p-0.5"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-text-secondary mb-3">Artifact Types</legend>
        <div className="space-y-2" role="group" aria-label="Select artifact types to filter">
          {ARTIFACT_TYPES.map(({ type, label, icon: Icon }) => {
            const isChecked = filters.filters.types.includes(type);
            return (
              <label
                key={type}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleTypeToggle(type)}
                  className="w-4 h-4 rounded border-bg-elevated bg-bg-tertiary text-text-accent focus:ring-2 focus:ring-text-accent focus:ring-offset-0 cursor-pointer"
                  aria-label={`Filter by ${label}`}
                />
                <Icon className={cn("w-4 h-4 transition-colors", isChecked ? "text-text-accent" : "text-text-secondary")} aria-hidden="true" />
                <span className={cn("text-sm transition-colors", isChecked ? "text-text-primary font-medium" : "text-text-secondary")}>
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-medium text-text-secondary mb-3">Date Range</legend>
        <div className="space-y-2 mb-3" role="group" aria-label="Date range presets">
          {DATE_PRESETS.map(({ label, days }) => {
            const isActive =
              !customDateRange &&
              filters.filters.dateFrom !== null &&
              filters.filters.dateTo !== null;
            return (
              <button
                key={label}
                onClick={() => handleDatePreset(days)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-text-accent focus:ring-offset-2",
                  isActive
                    ? "bg-text-accent/10 text-text-accent font-medium"
                    : "bg-bg-tertiary text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                )}
                aria-pressed={isActive}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <div>
            <label htmlFor="date-from" className="block text-xs text-text-secondary mb-1">
              From
            </label>
            <input
              id="date-from"
              type="date"
              value={formatDateForInput(filters.filters.dateFrom)}
              onChange={(e) => handleCustomDateChange("from", e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-bg-elevated rounded-lg focus:outline-none focus:ring-2 focus:border-text-accent focus:ring-text-accent transition-colors text-sm text-text-primary"
              aria-label="Start date for date range filter"
            />
          </div>
          <div>
            <label htmlFor="date-to" className="block text-xs text-text-secondary mb-1">
              To
            </label>
            <input
              id="date-to"
              type="date"
              value={formatDateForInput(filters.filters.dateTo)}
              onChange={(e) => handleCustomDateChange("to", e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-bg-elevated rounded-lg focus:outline-none focus:ring-2 focus:border-text-accent focus:ring-text-accent transition-colors text-sm text-text-primary"
              aria-label="End date for date range filter"
            />
          </div>
        </div>
      </fieldset>
    </aside>
  );
});
