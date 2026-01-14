"use client";

import { useState, useMemo } from "react";
import { useGallery } from "@/hooks/useGallery";
import { useDebounce } from "@/hooks/useDebounce";
import { CommonsPromptCard } from "./CommonsPromptCard";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptySearchState } from "@/components/shared/EmptySearchState";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
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
        <PageHeader
          title="The Global Commons"
          subtitle="Discover prompts shared by the community"
          icon={Globe}
          iconClassName="text-blue-500"
        />
        <LoadingState count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="The Global Commons"
          subtitle="Discover prompts shared by the community"
          icon={Globe}
          iconClassName="text-blue-500"
        />
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
        <PageHeader
          title="The Global Commons"
          subtitle="Discover prompts shared by the community"
          icon={Globe}
          iconClassName="text-blue-500"
        />
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
      <PageHeader
        title="The Global Commons"
        subtitle="Discover prompts shared by the community"
        icon={Globe}
        iconClassName="text-blue-500"
      />

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
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                aria-label="Show all public prompts"
                aria-pressed={filter === 'all'}
              >
                All Public
              </Button>
              <Button
                onClick={() => setFilter('mine')}
                variant={filter === 'mine' ? 'default' : 'ghost'}
                size="sm"
                aria-label="Show only my public prompts"
                aria-pressed={filter === 'mine'}
              >
                My Public
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2" role="group" aria-label="Sort public prompts">
            <ArrowUpDown className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
            <span className="text-sm font-medium text-text-secondary" id="sort-label-commons">Sort:</span>
            <div className="flex gap-2" aria-labelledby="sort-label-commons">
              <Button
                onClick={() => setSort('recent')}
                variant={sort === 'recent' ? 'default' : 'ghost'}
                size="sm"
                aria-label="Sort by most recent"
                aria-pressed={sort === 'recent'}
              >
                Recent
              </Button>
              <Button
                onClick={() => setSort('score')}
                variant={sort === 'score' ? 'default' : 'ghost'}
                size="sm"
                aria-label="Sort by highest score"
                aria-pressed={sort === 'score'}
              >
                Highest Score
              </Button>
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
