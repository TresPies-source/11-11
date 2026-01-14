"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { updatePromptStatus } from "@/lib/pglite/prompts";
import { useToast } from "@/hooks/useToast";
import type { PromptStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface StatusTransitionButtonProps {
  promptId: string;
  currentStatus: PromptStatus;
  targetStatus: PromptStatus;
  label: string;
  icon?: React.ReactNode;
  onTransitionComplete?: (newStatus: PromptStatus) => void;
  className?: string;
  variant?: "primary" | "secondary";
}

export function StatusTransitionButton({
  promptId,
  currentStatus,
  targetStatus,
  label,
  icon,
  onTransitionComplete,
  className = "",
  variant = "primary",
}: StatusTransitionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: showError } = useToast();

  const handleTransition = async () => {
    setIsLoading(true);

    try {
      await updatePromptStatus(promptId, targetStatus);

      success(getSuccessMessage(targetStatus));

      onTransitionComplete?.(targetStatus);
    } catch (error) {
      console.error("Failed to update prompt status:", error);

      showError(getErrorMessage(targetStatus));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleTransition}
      disabled={isLoading}
      isLoading={isLoading}
      size="sm"
      variant={variant}
      className={className}
      aria-label={`${label} - Status transition from ${currentStatus} to ${targetStatus}`}
    >
      {!isLoading && icon}
      <span>{isLoading ? 'Saving...' : label}</span>
    </Button>
  );
}

function getSuccessMessage(targetStatus: PromptStatus): string {
  switch (targetStatus) {
    case "saved":
      return "🌺 Saved to Saved Prompts!";
    case "active":
      return "🌱 Moved to Active Prompts";
    case "archived":
      return "📦 Archived successfully";
    case "draft":
      return "✏️ Moved to drafts";
    default:
      return "Status updated successfully";
  }
}

function getErrorMessage(targetStatus: PromptStatus): string {
  switch (targetStatus) {
    case "saved":
      return "Failed to save to Saved Prompts. Please try again.";
    case "active":
      return "Failed to move to Active Prompts. Please try again.";
    case "archived":
      return "Failed to archive. Please try again.";
    case "draft":
      return "Failed to move to drafts. Please try again.";
    default:
      return "Failed to update status. Please try again.";
  }
}
