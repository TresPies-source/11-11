"use client";

import { useState, memo, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Copy, Check, PlayCircle, Pencil, ChevronDown, RefreshCw, Archive } from "lucide-react";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { usePromptStatus } from "@/hooks/usePromptStatus";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { CritiqueScore } from "./CritiqueScore";
import { CritiqueDetails } from "./CritiqueDetails";

interface GreenhouseCardProps {
  prompt: PromptWithCritique;
  searchQuery?: string;
  onStatusChange?: () => void;
}

const tagColors = [
  "bg-blue-50 text-blue-700",
  "bg-purple-50 text-purple-700",
  "bg-pink-50 text-pink-700",
  "bg-green-50 text-green-700",
  "bg-amber-50 text-amber-700",
];

export const GreenhouseCard = memo(function GreenhouseCard({ prompt, searchQuery, onStatusChange }: GreenhouseCardProps) {
  const router = useRouter();
  const toast = useToast();
  const { transitionStatus, transitioning } = usePromptStatus();
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const title = prompt.title;
  const description =
    prompt.metadata?.description ||
    prompt.content.split("\n").slice(0, 3).join(" ").slice(0, 150) + "...";
  const tags = prompt.metadata?.tags || [];

  const highlightText = useCallback((text: string, query?: string) => {
    if (!query || !query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  const handleQuickCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (prompt.content) {
      await navigator.clipboard.writeText(prompt.content);
      toast.success("Prompt copied to clipboard");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [prompt.content, toast]);

  const handleRunInChat = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/?loadPrompt=${prompt.id}`);
  }, [router, prompt.id]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/librarian/greenhouse?edit=${prompt.id}`);
  }, [router, prompt.id]);

  const handleCardClick = useCallback(() => {
    router.push(`/librarian/greenhouse?edit=${prompt.id}`);
  }, [router, prompt.id]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  }, [handleCardClick]);

  const handleReactivate = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const driveFileId = prompt.drive_file_id || null;
    const success = await transitionStatus(prompt.id, "active", driveFileId);
    
    if (success) {
      toast.success("🌱 Reactivated to Seedlings!");
      onStatusChange?.();
    } else {
      toast.error("Failed to reactivate prompt");
    }
  }, [prompt.id, prompt.drive_file_id, transitionStatus, toast, onStatusChange]);

  const handleArchive = useCallback(async () => {
    const driveFileId = prompt.drive_file_id || null;
    const success = await transitionStatus(prompt.id, "archived", driveFileId);
    
    if (success) {
      toast.success("📦 Archived successfully");
      setShowArchiveConfirm(false);
      onStatusChange?.();
    } else {
      toast.error("Failed to archive prompt");
      setShowArchiveConfirm(false);
    }
  }, [prompt.id, prompt.drive_file_id, transitionStatus, toast, onStatusChange]);

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

  const getTagColor = useCallback((index: number) => {
    return tagColors[index % tagColors.length];
  }, []);

  const critiqueScore = useMemo(() => prompt.latestCritique?.score ?? 0, [prompt.latestCritique?.score]);

  return (
    <motion.div
      layoutId={`prompt-card-${prompt.id}`}
      layout
      role="article"
      aria-label={`Greenhouse prompt: ${title}. Score: ${critiqueScore} out of 100. ${tags.length > 0 ? `Tags: ${tags.join(", ")}` : ""}`}
      tabIndex={0}
      className="group bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-200 hover:border-green-300 flex flex-col h-full cursor-pointer focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover="hover"
      onClick={handleCardClick}
      onKeyDown={handleKeyPress}
      transition={{
        layout: { duration: 0.3, ease: "easeInOut" },
      }}
    >
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0" role="img" aria-label="flowering prompt">
              🌺
            </span>
            <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2 flex-1">
              {highlightText(title, searchQuery)}
            </h3>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-3 ml-10">
          {highlightText(description, searchQuery)}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 ml-10">
            {tags.map((tag, index) => (
              <motion.span
                key={index}
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  getTagColor(index)
                )}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                whileHover={{
                  scale: 1.05,
                }}
              >
                {highlightText(tag, searchQuery)}
              </motion.span>
            ))}
          </div>
        )}

        <div className="ml-10 space-y-2">
          <CritiqueScore
            score={prompt.latestCritique?.score ?? 0}
            size="sm"
            showLabel={false}
          />
          
          {prompt.latestCritique && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="w-full flex items-center justify-between px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
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

      <div className="mt-auto pt-3 border-t border-gray-100 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handleRunInChat}
            aria-label={`Run ${title} in chat`}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:scale-95 transition-all duration-100 text-sm font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Run in Chat"
            disabled={transitioning}
          >
            <PlayCircle className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Run</span>
            <span className="sr-only sm:hidden">Run in chat</span>
          </button>

          <button
            onClick={handleQuickCopy}
            aria-label={copied ? `Copied ${title} to clipboard` : `Copy ${title} to clipboard`}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all duration-100 text-sm font-medium active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
              copied
                ? "bg-green-100 text-green-700 focus-visible:ring-green-500"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-500"
            )}
            title="Copy to Clipboard"
            disabled={transitioning}
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
          </button>

          <button
            onClick={handleEdit}
            aria-label={`Edit ${title}`}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 active:scale-95 transition-all duration-100 text-sm font-medium focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Edit Prompt"
            disabled={transitioning}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Edit</span>
            <span className="sr-only sm:hidden">Edit prompt</span>
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReactivate}
            aria-label={`Reactivate ${title}`}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 active:scale-95 transition-all duration-100 text-sm font-medium focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reactivate to Seedlings"
            disabled={transitioning}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Reactivate</span>
            <span className="sr-only sm:hidden">Reactivate to seedlings</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowArchiveConfirm(true);
            }}
            aria-label={`Archive ${title}`}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 active:scale-95 transition-all duration-100 text-sm font-medium focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Archive Prompt"
            disabled={transitioning}
          >
            <Archive className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Archive</span>
            <span className="sr-only sm:hidden">Archive prompt</span>
          </button>
        </div>
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
    </motion.div>
  );
});
