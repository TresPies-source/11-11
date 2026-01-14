"use client";

import { useState, useMemo } from "react";
import { useGallery } from "@/hooks/useGallery";
import { useDebounce } from "@/hooks/useDebounce";
import { CommonsPromptCard } from "./CommonsPromptCard";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptySearchState } from "@/components/shared/EmptySearchState";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Globe, Filter, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommonsView() {
  const { prompts, loading, error, retry, filter, setFilter, sort, setSort } = useGallery();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredPrompts = useMemo(() => {
    if (!debouncedSearch) return prompts;
    
    const query = debouncedSearch.toLowerCase();
    return prompts.filter((prompt) => {
      return (
        prompt.title.toLowerCase().includes(query) ||
        prompt.content.toLowerCase().includes(query) ||
        prompt.author_name?.toLowerCase().includes(query)
      );
    });
  }, [prompts, debouncedSearch]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-sans font-bold text-text-primary flex items-center gap-3">
            <Globe className="h-8 w-8 text-info" />
            The Global Commons
          </h1>
          <p className="text-text-secondary mt-2">Discover prompts shared by the community</p>
        </div>
        <LoadingState count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-sans font-bold text-text-primary flex items-center gap-3">
            <Globe className="h-8 w-8 text-info" />
            The Global Commons
          </h1>
          <p className="text-text-secondary mt-2">Discover prompts shared by the community</p>
        </div>
        <ErrorState
          title="Unable to load prompts"
          message={error}
          onRetry={retry}
          loading={loading}
        />
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-sans font-bold text-text-primary flex items-center gap-3">
            <Globe className="h-8 w-8 text-info" />
            The Global Commons
          </h1>
          <p className="text-text-secondary mt-2">Discover prompts shared by the community</p>
        </div>
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-12 text-center">
          <Globe className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-primary font-medium text-lg mb-2">
            No public prompts yet
          </p>
          <p className="text-text-secondary text-sm">
            Be the first to share! Mark your prompts as public: true in frontmatter
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" aria-label="Global Commons">
      <div className="mb-8">
        <h1 className="text-2xl font-sans font-bold text-text-primary flex items-center gap-3">
          <Globe className="h-8 w-8 text-info" aria-hidden="true" />
          The Global Commons
        </h1>
        <p className="text-text-secondary mt-2" role="status" aria-live="polite">
          Discover {prompts.length} public prompt{prompts.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search prompts by title, content, or author..."
          aria-label="Search public prompts"
        />

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2" role="group" aria-label="Filter public prompts">
            <Filter className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
            <span className="text-sm font-medium text-text-secondary" id="filter-label-commons">Filter:</span>
            <div className="flex gap-2" aria-labelledby="filter-label-commons">
              <button
                onClick={() => setFilter('all')}
                aria-label="Show all public prompts"
                aria-pressed={filter === 'all'}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  "focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2",
                  filter === 'all'
                    ? "bg-info text-white"
                    : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
                )}
              >
                All Public
              </button>
              <button
                onClick={() => setFilter('mine')}
                aria-label="Show only my public prompts"
                aria-pressed={filter === 'mine'}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  "focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2",
                  filter === 'mine'
                    ? "bg-info text-white"
                    : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
                )}
              >
                My Public
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2" role="group" aria-label="Sort public prompts">
            <ArrowUpDown className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
            <span className="text-sm font-medium text-text-secondary" id="sort-label-commons">Sort:</span>
            <div className="flex gap-2" aria-labelledby="sort-label-commons">
              <button
                onClick={() => setSort('recent')}
                aria-label="Sort by most recent"
                aria-pressed={sort === 'recent'}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  "focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2",
                  sort === 'recent'
                    ? "bg-info text-white"
                    : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
                )}
              >
                Recent
              </button>
              <button
                onClick={() => setSort('score')}
                aria-label="Sort by highest score"
                aria-pressed={sort === 'score'}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  "focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2",
                  sort === 'score'
                    ? "bg-info text-white"
                    : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
                )}
              >
                Highest Score
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredPrompts.length === 0 && searchTerm ? (
        <EmptySearchState
          searchTerm={searchTerm}
          onClear={() => setSearchTerm("")}
        />
      ) : (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          role="list"
          aria-label={`${filteredPrompts.length} public prompt${filteredPrompts.length !== 1 ? 's' : ''}`}
        >
          {filteredPrompts.map((prompt) => (
            <CommonsPromptCard
              key={prompt.id}
              prompt={prompt}
              onCopyComplete={() => retry()}
            />
          ))}
        </div>
      )}
    </main>
  );
}
