"use client";

import { useState, memo, useCallback } from "react";
import { Copy, Check, PlayCircle, Pencil, RefreshCw, Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { usePromptStatus } from "@/hooks/usePromptStatus";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { cn } from "@/lib/utils";

interface GreenhouseCardActionsProps {
  promptId: string;
  promptTitle: string;
  promptContent: string;
  driveFileId: string | null;
  onStatusChange?: () => void;
}

export const GreenhouseCardActions = memo(function GreenhouseCardActions({
  promptId,
  promptTitle,
  promptContent,
  driveFileId,
  onStatusChange,
}: GreenhouseCardActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const { transitionStatus, transitioning } = usePromptStatus();
  const [copied, setCopied] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const handleQuickCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (promptContent) {
      await navigator.clipboard.writeText(promptContent);
      toast.success("Prompt copied to clipboard");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [promptContent, toast]);

  const handleRunInChat = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/?loadPrompt=${promptId}`);
  }, [router, promptId]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/librarian/greenhouse?edit=${promptId}`);
  }, [router, promptId]);

  const handleReactivate = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await transitionStatus(promptId, "active", driveFileId);
    
    if (success) {
      toast.success("🌱 Reactivated to Active Prompts!");
      onStatusChange?.();
    } else {
      toast.error("Failed to reactivate prompt");
    }
  }, [promptId, driveFileId, transitionStatus, toast, onStatusChange]);

  const handleArchive = useCallback(async () => {
    const success = await transitionStatus(promptId, "archived", driveFileId);
    
    if (success) {
      toast.success("📦 Archived successfully");
      setShowArchiveConfirm(false);
      onStatusChange?.();
    } else {
      toast.error("Failed to archive prompt");
      setShowArchiveConfirm(false);
    }
  }, [promptId, driveFileId, transitionStatus, toast, onStatusChange]);

  return (
    <div className="mt-auto pt-3 border-t border-bg-tertiary space-y-2">
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleRunInChat}
          aria-label={`Run ${promptTitle} in chat`}
          disabled={transitioning}
          className="flex-1"
        >
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Run</span>
          <span className="sr-only sm:hidden">Run in chat</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleQuickCopy}
          aria-label={copied ? `Copied ${promptTitle} to clipboard` : `Copy ${promptTitle} to clipboard`}
          disabled={transitioning}
          className={cn(
            "flex-1",
            copied && "bg-success text-white hover:bg-success/90"
          )}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Copied</span>
              <span className="sr-only sm:hidden">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Copy</span>
              <span className="sr-only sm:hidden">Copy to clipboard</span>
            </>
          )}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleEdit}
          aria-label={`Edit ${promptTitle}`}
          disabled={transitioning}
          className="flex-1"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Edit</span>
          <span className="sr-only sm:hidden">Edit prompt</span>
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReactivate}
          aria-label={`Reactivate ${promptTitle} to Active Prompts`}
          disabled={transitioning}
          className="flex-1 bg-success text-white hover:bg-success/90"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Reactivate</span>
          <span className="sr-only sm:hidden">Reactivate to active prompts</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowArchiveConfirm(true);
          }}
          aria-label={`Archive ${promptTitle}`}
          disabled={transitioning}
          className="flex-1"
        >
          <Archive className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Archive</span>
          <span className="sr-only sm:hidden">Archive prompt</span>
        </Button>
      </div>

      <ConfirmationDialog
        open={showArchiveConfirm}
        title="Archive Prompt"
        message="Archive this prompt? You can restore it later from the archive view."
        confirmLabel="Archive"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveConfirm(false)}
      />
    </div>
  );
});
