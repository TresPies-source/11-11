"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { updatePromptStatus } from "@/lib/supabase/prompts";
import { useToast } from "@/hooks/useToast";
import type { PromptStatus } from "@/lib/types";
import { ANIMATION_EASE } from "@/lib/constants";

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

  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = variant === "primary"
    ? "bg-green-500 text-white hover:bg-green-600"
    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600";

  return (
    <motion.button
      onClick={handleTransition}
      disabled={isLoading}
      whileHover={{ scale: isLoading ? 1 : 1.05 }}
      whileTap={{ scale: isLoading ? 1 : 0.95 }}
      transition={{ duration: 0.2, ease: ANIMATION_EASE }}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          {icon}
          <span>{label}</span>
        </>
      )}
    </motion.button>
  );
}

function getSuccessMessage(targetStatus: PromptStatus): string {
  switch (targetStatus) {
    case "saved":
      return "🌺 Saved to Greenhouse!";
    case "active":
      return "🌱 Moved to Seedlings";
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
      return "Failed to save to Greenhouse. Please try again.";
    case "active":
      return "Failed to move to Seedlings. Please try again.";
    case "archived":
      return "Failed to archive. Please try again.";
    case "draft":
      return "Failed to move to drafts. Please try again.";
    default:
      return "Failed to update status. Please try again.";
  }
}
