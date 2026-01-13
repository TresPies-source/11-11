"use client";

import { useState, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sprout, ChevronDown, Play, Archive, FileText } from "lucide-react";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import type { PromptStatus } from "@/lib/pglite/types";
import { cn } from "@/lib/utils";
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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      transition: { duration: 0.2, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      layoutId={`prompt-card-${prompt.id}`}
      layout
      role="article"
      aria-label={`Seedling prompt: ${title}. Score: ${critiqueScore} out of 100. Status: ${prompt.status}${isProcessing ? '. Currently processing.' : ''}`}
      tabIndex={isProcessing ? -1 : 0}
      className={cn(
        "group bg-card rounded-lg border border-border p-4 transition-all duration-200 flex flex-col h-full focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background",
        isProcessing 
          ? "opacity-60 cursor-wait border-green-400 dark:border-green-600" 
          : "hover:shadow-lg hover:border-green-300 dark:hover:border-green-700 cursor-pointer"
      )}
      variants={cardVariants}
      initial="hidden"
      animate={isProcessing ? { opacity: 0.6, scale: 0.98 } : "visible"}
      exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.3, ease: "easeInOut" } }}
      whileHover={isProcessing ? {} : "hover"}
      onClick={isProcessing ? undefined : handleCardClick}
      onKeyDown={isProcessing ? undefined : handleKeyPress}
      onHoverStart={() => !isProcessing && setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      transition={{
        layout: { duration: 0.3, ease: "easeInOut" },
      }}
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
              <Sprout className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
            </motion.div>
            <h3 className="font-semibold text-foreground group-hover:text-green-600 dark:group-hover:text-green-500 transition-colors line-clamp-2">
              {title}
            </h3>
          </div>
          {prompt.visibility === 'public' && <PublicBadge variant="compact" />}
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{description}</p>

        <div className="mb-3 space-y-2">
          <CritiqueScore score={critiqueScore} size="sm" showLabel={true} />
          
          {prompt.latestCritique && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="w-full flex items-center justify-between px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded transition-colors"
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

      <div className="mt-auto pt-3 border-t border-border space-y-2">
        <div onClick={(e) => e.stopPropagation()}>
          <PublicToggle
            promptId={prompt.id}
            visibility={prompt.visibility}
            authorName={prompt.author_name || 'Anonymous'}
            className="w-full"
          />
        </div>
        {prompt.status === 'active' && onSaveToGreenhouse ? (
          <button
            onClick={handleSaveClick}
            disabled={isProcessing}
            aria-label={isSaving ? `Saving ${title} to greenhouse` : `Save ${title} to greenhouse`}
            aria-busy={isSaving}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-md transition-all duration-100 text-sm font-medium",
              isProcessing
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-green-600 dark:bg-green-600 text-white hover:bg-green-700 dark:hover:bg-green-700 active:scale-95 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background"
            )}
          >
            <span className="text-base" aria-hidden="true">🌺</span>
            {isSaving ? "Saving..." : "Save to Greenhouse"}
          </button>
        ) : null}

        {validTransitions.filter(t => t.to !== 'saved').map((transition) => {
          const getButtonStyles = () => {
            if (transition.to === 'active') {
              return {
                bg: "bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 focus-visible:ring-blue-500",
                icon: <Play className="h-4 w-4" />,
              };
            } else if (transition.to === 'archived') {
              return {
                bg: "bg-amber-600 dark:bg-amber-600 hover:bg-amber-700 dark:hover:bg-amber-700 focus-visible:ring-amber-500",
                icon: <Archive className="h-4 w-4" />,
              };
            } else if (transition.to === 'draft') {
              return {
                bg: "bg-gray-600 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-700 focus-visible:ring-gray-500",
                icon: <FileText className="h-4 w-4" />,
              };
            }
            return {
              bg: "bg-gray-600 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-700 focus-visible:ring-gray-500",
              icon: null,
            };
          };

          const styles = getButtonStyles();

          return (
            <button
              key={`${transition.from}-${transition.to}`}
              onClick={(e) => handleStatusTransition(e, transition.to, transition.label, transition.confirmationMessage)}
              disabled={isProcessing}
              aria-label={`${transition.label} ${title}`}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] rounded-md transition-all duration-100 text-sm font-medium",
                isProcessing
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : `${styles.bg} text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background`
              )}
            >
              {styles.icon}
              {isTransitioning ? "Processing..." : transition.label}
            </button>
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
    </motion.div>
  );
});
