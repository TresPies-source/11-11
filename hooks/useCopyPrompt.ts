"use client";

import { useState, useCallback } from "react";
import { useToast } from "./useToast";
import type { PromptWithCritique } from "@/lib/pglite/prompts";

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
        const response = await fetch("/api/librarian/copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId, userId: "dev-user" }),
        });

        if (!response.ok) {
          throw new Error("Failed to copy prompt");
        }

        const data = await response.json();

        if (data.success && data.newPrompt) {
          success("✅ Copied to your Greenhouse!");
          return data.newPrompt;
        } else {
          throw new Error(data.message || "Failed to copy prompt");
        }
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
