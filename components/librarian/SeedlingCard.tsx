"use client";

import { useState, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sprout, ChevronDown, Play, Archive, FileText } from "lucide-react";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import type { PromptStatus } from "@/lib/pglite/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CritiqueScore } from "./CritiqueScore";
import { CritiqueDetails } from "./CritiqueDetails";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { getValidTransitions } from "@/lib/pglite/statusTransitions";
import { PublicToggle } from "./PublicToggle";
import { PublicBadge } from "./PublicBadge";

interface SeedlingCardProps {
  prompt: PromptWithCritique;
  onSaveToGreenhouse?: (promptId: string) => void;
  onStatusChange?: (promptId: string, newStatus: PromptStatus) => Promise<void>;
  isSaving?: boolean;
}

export const SeedlingCard = memo(function SeedlingCard({ 
  prompt, 
  onSaveToGreenhouse,
  onStatusChange,
  isSaving = false 
}: SeedlingCardProps) {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<{ to: PromptStatus; label: string; message: string } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const title = prompt.title;
  const description =
    prompt.metadata?.description ||
    prompt.content.split("\n").slice(0, 3).join(" ").slice(0, 150) + "..." ||
    "No description available";
  
  const critiqueScore = prompt.latestCritique?.score ?? 0;

  const handleCardClick = useCallback(() => {
    router.push(`/?loadPrompt=${prompt.id}`);
  }, [router, prompt.id]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  }, [handleCardClick]);

  const handleSaveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSaveToGreenhouse && !isSaving) {
      onSaveToGreenhouse(prompt.id);
    }
  }, [onSaveToGreenhouse, isSaving, prompt.id]);

  const executeTransition = useCallback(async (to: PromptStatus) => {
    if (!onStatusChange) return;

    setIsTransitioning(true);
    try {
      await onStatusChange(prompt.id, to);
    } catch (error) {
      console.error('Status transition failed:', error);
    } finally {
      setIsTransitioning(false);
      setConfirmDialogOpen(false);
      setPendingTransition(null);
    }
  }, [onStatusChange, prompt.id]);

  const handleStatusTransition = useCallback((e: React.MouseEvent, to: PromptStatus, label: string, confirmationMessage?: string) => {
    e.stopPropagation();
    if (isTransitioning) return;

    if (confirmationMessage) {
      setPendingTransition({ to, label, message: confirmationMessage });
      setConfirmDialogOpen(true);
    } else {
      executeTransition(to);
    }
  }, [isTransitioning, executeTransition]);

  const handleConfirmTransition = useCallback(() => {
    if (pendingTransition) {
      executeTransition(pendingTransition.to);
    }
  }, [pendingTransition, executeTransition]);

  const handleCancelTransition = useCallback(() => {
    setConfirmDialogOpen(false);
    setPendingTransition(null);
  }, []);

  const validTransitions = getValidTransitions(prompt.status);
  const isProcessing = isSaving || isTransitioning;

  return (
    <motion.div
      layoutId={`prompt-card-${prompt.id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={isProcessing ? { opacity: 0.6, scale: 0.98 } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2, ease: "easeInOut" } }}
      transition={{
        layout: { duration: 0.2, ease: "easeInOut" },
        opacity: { duration: 0.2 },
      }}
      onHoverStart={() => !isProcessing && setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      role="article"
      aria-label={`Active prompt: ${title}. Score: ${critiqueScore} out of 100. Status: ${prompt.status}${isProcessing ? '. Currently processing.' : ''}`}
      tabIndex={isProcessing ? -1 : 0}
      onClick={isProcessing ? undefined : handleCardClick}
      onKeyDown={isProcessing ? undefined : handleKeyPress}
      className={cn(
        "h-full focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:outline-none rounded-xl",
        isProcessing 
          ? "cursor-wait" 
          : "cursor-pointer"
      )}
    >
      <Card
        className="group flex flex-col h-full"
      >
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1">
            <motion.div
              animate={{
                scale: isHovering ? 1.1 : 1,
                rotate: isHovering ? 5 : 0,
              }}
              transition={{ duration: 0.2 }}
              aria-hidden="true"
            >
              <Sprout className="h-5 w-5 text-librarian flex-shrink-0" />
            </motion.div>
            <h3 className="font-semibold text-text-primary group-hover:text-librarian transition-colors line-clamp-2">
              {title}
            </h3>
          </div>
          {prompt.visibility === 'public' && <PublicBadge variant="compact" />}
        </div>

        <p className="text-sm text-text-secondary mb-3 line-clamp-3">{description}</p>

        <div className="mb-3 space-y-2">
          <CritiqueScore score={critiqueScore} size="sm" showLabel={true} />
          
          {prompt.latestCritique && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="w-full flex items-center justify-between px-2 py-1 text-xs text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
                aria-expanded={showDetails}
                aria-label={`${showDetails ? 'Hide' : 'Show'} detailed critique breakdown`}
              >
                <span className="font-medium">View Details</span>
                <ChevronDown 
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    showDetails && "rotate-180"
                  )} 
                />
              </button>
              
              {showDetails && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="pt-2"
                >
                  <CritiqueDetails critique={prompt.latestCritique} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-bg-tertiary space-y-2">
        <div onClick={(e) => e.stopPropagation()}>
          <PublicToggle
            promptId={prompt.id}
            visibility={prompt.visibility}
            authorName={prompt.author_name || 'Anonymous'}
            className="w-full"
          />
        </div>
        {prompt.status === 'active' && onSaveToGreenhouse ? (
          <Button
            onClick={handleSaveClick}
            disabled={isProcessing}
            aria-label={isSaving ? `Saving ${title} to Saved Prompts` : `Save ${title} to Saved Prompts`}
            aria-busy={isSaving}
            variant="primary"
            size="sm"
            className="w-full"
          >
            <span className="text-base" aria-hidden="true">🌺</span>
            {isSaving ? "Saving..." : "Save to Saved Prompts"}
          </Button>
        ) : null}

        {validTransitions.filter(t => t.to !== 'saved').map((transition) => {
          const getButtonIcon = () => {
            if (transition.to === 'active') {
              return <Play className="h-4 w-4" />;
            } else if (transition.to === 'archived') {
              return <Archive className="h-4 w-4" />;
            } else if (transition.to === 'draft') {
              return <FileText className="h-4 w-4" />;
            }
            return null;
          };

          const icon = getButtonIcon();

          return (
            <Button
              key={`${transition.from}-${transition.to}`}
              onClick={(e) => handleStatusTransition(e, transition.to, transition.label, transition.confirmationMessage)}
              disabled={isProcessing}
              aria-label={`${transition.label} ${title}`}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              {icon}
              {isTransitioning ? "Processing..." : transition.label}
            </Button>
          );
        })}
      </div>

      <ConfirmationDialog
        open={confirmDialogOpen}
        title={pendingTransition ? pendingTransition.label : ''}
        message={pendingTransition ? pendingTransition.message : ''}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={handleConfirmTransition}
        onCancel={handleCancelTransition}
        variant="warning"
      />
      </Card>
    </motion.div>
  );
});
