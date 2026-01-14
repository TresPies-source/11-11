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
            ? "bg-info text-white hover:bg-opacity-90"
            : "bg-bg-tertiary text-text-secondary hover:bg-bg-elevated",
          isDisabled && "opacity-50 cursor-not-allowed",
          "focus:ring-2 focus:ring-offset-2",
          isPublic ? "focus:ring-info" : "focus:ring-text-accent",
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
