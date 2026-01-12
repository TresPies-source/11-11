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
import { Sprout } from "lucide-react";

export function GreenhouseView() {
  const { prompts, loading, error, retry } = useLibrary();
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
            <Sprout className="h-8 w-8" />
            🌺 My Greenhouse
          </h1>
          <p className="text-gray-600 mt-2">Your cultivated prompts ready to bloom</p>
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
            <Sprout className="h-8 w-8" />
            🌺 My Greenhouse
          </h1>
          <p className="text-gray-600 mt-2">Your cultivated prompts ready to bloom</p>
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
            <Sprout className="h-8 w-8" />
            🌺 My Greenhouse
          </h1>
          <p className="text-gray-600 mt-2">Your cultivated prompts ready to bloom</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Sprout className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium text-lg mb-2">
            Your greenhouse is empty
          </p>
          <p className="text-gray-500 text-sm">
            Create your first prompt in the 03_Prompts folder or fork one from the Commons
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Sprout className="h-8 w-8" />
          🌺 My Greenhouse
        </h1>
        <p className="text-gray-600 mt-2">
          Your cultivated collection of {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}
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
            <PromptCard key={prompt.id} prompt={prompt} variant="greenhouse" />
          ))}
        </div>
      )}
    </div>
  );
}
