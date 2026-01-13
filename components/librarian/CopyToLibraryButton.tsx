"use client";

import { Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { useCopyPrompt } from "@/hooks/useCopyPrompt";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import { cn } from "@/lib/utils";

interface CopyToLibraryButtonProps {
  promptId: string;
  onCopyComplete?: (newPrompt: PromptWithCritique) => void;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "compact";
}

export function CopyToLibraryButton({
  promptId,
  onCopyComplete,
  disabled = false,
  className,
  variant = "default",
}: CopyToLibraryButtonProps) {
  const { copyPrompt, isCopying } = useCopyPrompt();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isCopying || copied) return;

      const result = await copyPrompt(promptId);
      if (result) {
        setCopied(true);
        onCopyComplete?.(result);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [promptId, copyPrompt, isCopying, copied, onCopyComplete]
  );

  const isDisabled = disabled || isCopying;
  const isCompact = variant === "compact";

  return (
    <motion.button
      onClick={handleCopy}
      disabled={isDisabled}
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      aria-label="Copy prompt to your library"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200",
        isCompact ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm",
        copied
          ? "bg-green-600 text-white hover:bg-green-700"
          : "bg-blue-600 text-white hover:bg-blue-700",
        isDisabled && "opacity-50 cursor-not-allowed",
        "focus:ring-2 focus:ring-offset-2",
        copied ? "focus:ring-green-500" : "focus:ring-blue-500",
        className
      )}
    >
      {isCopying ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Copy className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden="true" />
          </motion.div>
          <span>Copying...</span>
        </>
      ) : copied ? (
        <>
          <Check className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden="true" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden="true" />
          <span>Copy to Library</span>
        </>
      )}
    </motion.button>
  );
}
