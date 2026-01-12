"use client";

import { useState } from "react";
import { useGallery } from "@/hooks/useGallery";
import { usePromptSearch } from "@/hooks/usePromptSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { PromptCard } from "@/components/shared/PromptCard";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptySearchState } from "@/components/shared/EmptySearchState";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Globe } from "lucide-react";

export function CommonsView() {
  const { prompts, loading, error, retry } = useGallery();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { filteredPrompts } = usePromptSearch({
    prompts,
    searchTerm: debouncedSearch,
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Globe className="h-8 w-8" />
            ✨ The Global Commons
          </h1>
          <p className="text-gray-600 mt-2">Discover prompts shared by the community</p>
        </div>
        <LoadingState count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Globe className="h-8 w-8" />
            ✨ The Global Commons
          </h1>
          <p className="text-gray-600 mt-2">Discover prompts shared by the community</p>
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Globe className="h-8 w-8" />
            ✨ The Global Commons
          </h1>
          <p className="text-gray-600 mt-2">Discover prompts shared by the community</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium text-lg mb-2">
            No public prompts yet
          </p>
          <p className="text-gray-500 text-sm">
            Be the first to share! Mark your prompts as public: true in frontmatter
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Globe className="h-8 w-8" />
          ✨ The Global Commons
        </h1>
        <p className="text-gray-600 mt-2">
          Discover {prompts.length} public prompt{prompts.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="mb-6">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search prompts by title, description, or tags..."
        />
      </div>

      {filteredPrompts.length === 0 && searchTerm ? (
        <EmptySearchState
          searchTerm={searchTerm}
          onClear={() => setSearchTerm("")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} variant="commons" />
          ))}
        </div>
      )}
    </div>
  );
}
