"use client";

import { useState } from "react";
import { useLibrary } from "@/hooks/useLibrary";
import { usePromptSearch } from "@/hooks/usePromptSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { PromptCard } from "@/components/shared/PromptCard";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptySearchState } from "@/components/shared/EmptySearchState";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Sprout, X } from "lucide-react";

export function GreenhouseView() {
  const { prompts, loading, error, retry } = useLibrary();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { filteredPrompts: searchFilteredPrompts } = usePromptSearch({
    prompts,
    searchTerm: debouncedSearch,
  });

  const filteredPrompts = selectedTags.length > 0
    ? searchFilteredPrompts.filter((prompt) =>
        selectedTags.every((tag) => prompt.metadata?.tags?.includes(tag))
      )
    : searchFilteredPrompts;

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="My Saved Prompts"
          subtitle="Your cultivated prompts ready to bloom"
          icon={Sprout}
          iconClassName="text-green-500"
        />
        <LoadingState count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="My Saved Prompts"
          subtitle="Your cultivated prompts ready to bloom"
          icon={Sprout}
          iconClassName="text-green-500"
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
          title="My Saved Prompts"
          subtitle="Your cultivated prompts ready to bloom"
          icon={Sprout}
          iconClassName="text-green-500"
        />
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-12 text-center">
          <Sprout className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-primary font-medium text-lg mb-2">
            Your saved prompts library is empty
          </p>
          <p className="text-text-secondary text-sm">
            Create your first prompt in the 03_Prompts folder or fork one from the Commons
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" aria-label="Saved Prompts Library">
      <PageHeader
        title="My Saved Prompts"
        subtitle="Your cultivated prompts ready to bloom"
        icon={Sprout}
        iconClassName="text-green-500"
      />

      <div className="mb-6">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search prompts by title, description, or tags..."
          aria-label="Search saved prompts"
        />
      </div>

      {selectedTags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-tertiary font-medium">Filtering by:</span>
          {selectedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-librarian text-white rounded-full text-sm font-medium hover:bg-text-accent active:scale-95 transition-all duration-100"
              aria-label={`Remove filter: ${tag}`}
            >
              {tag}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            onClick={clearTagFilters}
            className="text-sm text-text-tertiary hover:text-text-primary underline"
            aria-label="Clear all tag filters"
          >
            Clear all
          </button>
        </div>
      )}

      {filteredPrompts.length === 0 && (searchTerm || selectedTags.length > 0) ? (
        <EmptySearchState
          searchTerm={searchTerm || `tags: ${selectedTags.join(", ")}`}
          onClear={() => {
            setSearchTerm("");
            clearTagFilters();
          }}
        />
      ) : (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          role="list"
          aria-label={`${filteredPrompts.length} saved prompt${filteredPrompts.length !== 1 ? 's' : ''}`}
        >
          {filteredPrompts.map((prompt) => (
            <PromptCard 
              key={prompt.id} 
              prompt={prompt} 
              variant="greenhouse"
              onTagClick={handleTagClick}
            />
          ))}
        </div>
      )}
    </main>
  );
}
