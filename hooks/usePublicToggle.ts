"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "./useToast";

interface UsePublicToggleOptions {
  promptId: string;
  initialVisibility: string;
  authorName: string;
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
      const response = await fetch("/api/librarian/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, authorName }),
      });

      if (!response.ok) {
        throw new Error("Failed to publish prompt");
      }

      const data = await response.json();

      if (data.success) {
        setIsPublic(true);
        success("🌍 Prompt published to Commons!");
        onToggleComplete?.(true);
      } else {
        throw new Error(data.message || "Failed to publish prompt");
      }
    } catch (error) {
      console.error("Failed to publish prompt:", error);
      showError("Failed to publish prompt. Please try again.");
      setIsPublic(false);
    } finally {
      setIsPublishing(false);
    }
  }, [promptId, authorName, success, showError, onToggleComplete]);

  const unpublishPrompt = useCallback(async () => {
    setIsPublishing(true);

    try {
      const response = await fetch("/api/librarian/unpublish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId }),
      });

      if (!response.ok) {
        throw new Error("Failed to unpublish prompt");
      }

      const data = await response.json();

      if (data.success) {
        setIsPublic(false);
        success("Prompt made private");
        onToggleComplete?.(false);
      } else {
        throw new Error(data.message || "Failed to unpublish prompt");
      }
    } catch (error) {
      console.error("Failed to unpublish prompt:", error);
      showError("Failed to make prompt private. Please try again.");
      setIsPublic(true);
    } finally {
      setIsPublishing(false);
    }
  }, [promptId, success, showError, onToggleComplete]);

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
