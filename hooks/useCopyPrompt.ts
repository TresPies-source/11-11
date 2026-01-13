"use client";

import { useState, useCallback } from "react";
import { useToast } from "./useToast";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import { copyPrompt as copyPromptDB } from "@/lib/pglite/prompts";
import { DEFAULT_USER_ID } from "@/lib/pglite/client";

interface UseCopyPromptReturn {
  copyPrompt: (promptId: string) => Promise<PromptWithCritique | null>;
  isCopying: boolean;
  error: string | null;
}

export function useCopyPrompt(): UseCopyPromptReturn {
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const copyPrompt = useCallback(
    async (promptId: string): Promise<PromptWithCritique | null> => {
      setIsCopying(true);
      setError(null);

      try {
        const copiedPrompt = await copyPromptDB(promptId, DEFAULT_USER_ID);

        if (!copiedPrompt) {
          throw new Error("Failed to copy prompt - prompt not found or not public");
        }

        success("✅ Copied to your Greenhouse!");
        return copiedPrompt;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to copy prompt";
        setError(errorMessage);
        showError(errorMessage);
        console.error("Failed to copy prompt:", err);
        return null;
      } finally {
        setIsCopying(false);
      }
    },
    [success, showError]
  );

  return {
    copyPrompt,
    isCopying,
    error,
  };
}
