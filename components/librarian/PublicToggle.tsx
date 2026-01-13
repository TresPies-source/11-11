"use client";

import { motion } from "framer-motion";
import { Globe, Lock } from "lucide-react";
import { usePublicToggle } from "@/hooks/usePublicToggle";
import { PublishConfirmDialog } from "./PublishConfirmDialog";
import { cn } from "@/lib/utils";

interface PublicToggleProps {
  promptId: string;
  visibility: string;
  authorName: string;
  onToggleComplete?: (isPublic: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function PublicToggle({
  promptId,
  visibility,
  authorName,
  onToggleComplete,
  disabled = false,
  className,
}: PublicToggleProps) {
  const {
    isPublic,
    isPublishing,
    showConfirmDialog,
    togglePublic,
    confirmPublish,
    cancelPublish,
  } = usePublicToggle({
    promptId,
    initialVisibility: visibility,
    authorName,
    onToggleComplete,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && !isPublishing) {
      togglePublic();
    }
  };

  const isDisabled = disabled || isPublishing;

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={
          isPublic
            ? "Make prompt private"
            : "Make prompt public"
        }
        aria-pressed={isPublic}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
          isPublic
            ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300",
          isDisabled && "opacity-50 cursor-not-allowed",
          "focus:ring-2 focus:ring-offset-2",
          isPublic ? "focus:ring-blue-500" : "focus:ring-gray-500",
          className
        )}
      >
        <motion.div
          animate={{
            rotate: isPublishing ? 360 : 0,
          }}
          transition={{
            duration: 1,
            repeat: isPublishing ? Infinity : 0,
            ease: "linear",
          }}
        >
          {isPublic ? (
            <Globe className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Lock className="h-4 w-4" aria-hidden="true" />
          )}
        </motion.div>
        <span>{isPublic ? "Public" : "Private"}</span>
      </button>

      <PublishConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={confirmPublish}
        onCancel={cancelPublish}
      />
    </>
  );
}
