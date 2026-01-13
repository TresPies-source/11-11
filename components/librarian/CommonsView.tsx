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
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-600 dark:text-blue-500" />
            ✨ The Global Commons
          </h1>
          <p className="text-muted-foreground mt-2">Discover prompts shared by the community</p>
        </div>
        <LoadingState count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-600 dark:text-blue-500" />
            ✨ The Global Commons
          </h1>
          <p className="text-muted-foreground mt-2">Discover prompts shared by the community</p>
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
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-600 dark:text-blue-500" />
            ✨ The Global Commons
          </h1>
          <p className="text-muted-foreground mt-2">Discover prompts shared by the community</p>
        </div>
        <div className="bg-secondary/50 border border-border rounded-lg p-12 text-center">
          <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-medium text-lg mb-2">
            No public prompts yet
          </p>
          <p className="text-muted-foreground text-sm">
            Be the first to share! Mark your prompts as public: true in frontmatter
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Globe className="h-8 w-8 text-blue-600 dark:text-blue-500" />
          ✨ The Global Commons
        </h1>
        <p className="text-muted-foreground mt-2">
          Discover {prompts.length} public prompt{prompts.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search prompts by title, content, or author..."
        />

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  filter === 'all'
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                All Public
              </button>
              <button
                onClick={() => setFilter('mine')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  filter === 'mine'
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                My Public
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-700">Sort:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSort('recent')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  sort === 'recent'
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Recent
              </button>
              <button
                onClick={() => setSort('score')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  sort === 'score'
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <CommonsPromptCard
              key={prompt.id}
              prompt={prompt}
              onCopyComplete={() => retry()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
