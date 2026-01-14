"use client";

import { Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { useCopyPrompt } from "@/hooks/useCopyPrompt";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

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
  const buttonSize = variant === "compact" ? "sm" : "md";

  return (
    <Button
      variant="primary"
      size={buttonSize}
      onClick={handleCopy}
      disabled={isDisabled}
      aria-label="Copy prompt to your library"
      className={cn(className, copied && "bg-success hover:bg-success/90")}
    >
      {isCopying ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </motion.div>
          <span>Copying...</span>
        </>
      ) : copied ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden="true" />
          <span>Copy to Library</span>
        </>
      )}
    </Button>
  );
}
