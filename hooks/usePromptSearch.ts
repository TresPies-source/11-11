import { useMemo } from "react";
import type { PromptFile } from "@/lib/types";

interface UsePromptSearchParams {
  prompts: PromptFile[];
  searchTerm: string;
}

interface UsePromptSearchReturn {
  filteredPrompts: PromptFile[];
}

export function usePromptSearch({
  prompts,
  searchTerm,
}: UsePromptSearchParams): UsePromptSearchReturn {
  const filteredPrompts = useMemo(() => {
    if (!searchTerm.trim()) {
      return prompts;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    return prompts.filter((prompt) => {
      const title = (
        prompt.metadata?.title ||
        prompt.name.replace(/\.md$/, "")
      ).toLowerCase();
      const description = (prompt.metadata?.description || "").toLowerCase();
      const tags = prompt.metadata?.tags || [];

      const matchesTitle = title.includes(lowerSearchTerm);
      const matchesDescription = description.includes(lowerSearchTerm);
      const matchesTags = tags.some((tag) =>
        tag.toLowerCase().includes(lowerSearchTerm)
      );

      return matchesTitle || matchesDescription || matchesTags;
    });
  }, [prompts, searchTerm]);

  return { filteredPrompts };
}
