"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "./useToast";
import { publishPrompt as publishPromptDB, unpublishPrompt as unpublishPromptDB } from "@/lib/pglite/prompts";
import { DEFAULT_USER_ID } from "@/lib/pglite/client";

interface UsePublicToggleOptions {
  promptId: string;
  initialVisibility: string;
  authorName: string;
  userId?: string;
  onToggleComplete?: (isPublic: boolean) => void;
}

interface UsePublicToggleReturn {
  isPublic: boolean;
  isPublishing: boolean;
  showConfirmDialog: boolean;
  publishPrompt: () => Promise<void>;
  unpublishPrompt: () => Promise<void>;
  togglePublic: () => void;
  confirmPublish: () => Promise<void>;
  cancelPublish: () => void;
}

const CONFIRM_DIALOG_KEY = "hidePublishConfirmDialog";

export function usePublicToggle({
  promptId,
  initialVisibility,
  authorName,
  userId = DEFAULT_USER_ID,
  onToggleComplete,
}: UsePublicToggleOptions): UsePublicToggleReturn {
  const [isPublic, setIsPublic] = useState(initialVisibility === "public");
  const [isPublishing, setIsPublishing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    setIsPublic(initialVisibility === "public");
  }, [initialVisibility]);

  const publishPrompt = useCallback(async () => {
    setIsPublishing(true);

    try {
      const updatedPrompt = await publishPromptDB(promptId, userId, authorName);

      if (!updatedPrompt) {
        throw new Error("Prompt not found");
      }

      setIsPublic(true);
      success("🌍 Prompt published to Commons!");
      onToggleComplete?.(true);
    } catch (error) {
      console.error("Failed to publish prompt:", error);
      showError("Failed to publish prompt. Please try again.");
      setIsPublic(false);
    } finally {
      setIsPublishing(false);
    }
  }, [promptId, authorName, userId, success, showError, onToggleComplete]);

  const unpublishPrompt = useCallback(async () => {
    setIsPublishing(true);

    try {
      const updatedPrompt = await unpublishPromptDB(promptId, userId);

      if (!updatedPrompt) {
        throw new Error("Prompt not found");
      }

      setIsPublic(false);
      success("Prompt made private");
      onToggleComplete?.(false);
    } catch (error) {
      console.error("Failed to unpublish prompt:", error);
      showError("Failed to make prompt private. Please try again.");
      setIsPublic(true);
    } finally {
      setIsPublishing(false);
    }
  }, [promptId, userId, success, showError, onToggleComplete]);

  const togglePublic = useCallback(() => {
    if (isPublishing) return;

    if (!isPublic) {
      const hideConfirm = localStorage.getItem(CONFIRM_DIALOG_KEY) === "true";
      if (hideConfirm) {
        publishPrompt();
      } else {
        setShowConfirmDialog(true);
      }
    } else {
      unpublishPrompt();
    }
  }, [isPublic, isPublishing, publishPrompt, unpublishPrompt]);

  const confirmPublish = useCallback(async () => {
    setShowConfirmDialog(false);
    await publishPrompt();
  }, [publishPrompt]);

  const cancelPublish = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  return {
    isPublic,
    isPublishing,
    showConfirmDialog,
    publishPrompt,
    unpublishPrompt,
    togglePublic,
    confirmPublish,
    cancelPublish,
  };
}
