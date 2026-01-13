"use client";

import { useState, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, RotateCcw, Trash2, Clock } from "lucide-react";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { CritiqueScore } from "./CritiqueScore";

interface ArchiveCardProps {
  prompt: PromptWithCritique;
  selected: boolean;
  onSelect: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  searchQuery?: string;
}

const tagColors = [
  "bg-blue-50 text-blue-700",
  "bg-purple-50 text-purple-700",
  "bg-pink-50 text-pink-700",
  "bg-green-50 text-green-700",
  "bg-amber-50 text-amber-700",
];

export const ArchiveCard = memo(function ArchiveCard({
  prompt,
  selected,
  onSelect,
  onRestore,
  onDelete,
  searchQuery,
}: ArchiveCardProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const title = prompt.title;
  const description =
    prompt.metadata?.description ||
    prompt.content.split("\n").slice(0, 3).join(" ").slice(0, 150) + "...";
  const tags = prompt.metadata?.tags || [];

  const archivedDate = new Date(prompt.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

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

  const handleRestore = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRestore(prompt.id);
  }, [onRestore, prompt.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(prompt.id);
  }, [onDelete, prompt.id]);

  const handleCheckboxChange = useCallback(() => {
    onSelect(prompt.id);
  }, [onSelect, prompt.id]);

  const handleCardClick = useCallback(() => {
    onSelect(prompt.id);
  }, [onSelect, prompt.id]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCheckboxChange();
    }
  }, [handleCheckboxChange]);

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

  return (
    <motion.div
      layoutId={`archive-card-${prompt.id}`}
      layout
      role="article"
      aria-label={`Archived prompt: ${title}. Archived on ${archivedDate}. ${selected ? 'Selected' : 'Not selected'}. ${tags.length > 0 ? `Tags: ${tags.join(", ")}` : ""}`}
      tabIndex={0}
      className={cn(
        "group bg-white rounded-lg border p-4 hover:shadow-lg transition-all duration-200 flex flex-col h-full cursor-pointer focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2",
        selected
          ? "border-blue-500 ring-2 ring-blue-300 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      )}
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
            <input
              type="checkbox"
              checked={selected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
              aria-label={`Select ${title}`}
            />
            <span className="text-2xl flex-shrink-0" role="img" aria-label="archived prompt">
              📦
            </span>
            <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2 flex-1">
              {highlightText(title, searchQuery)}
            </h3>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3 ml-14 line-clamp-3">
          {highlightText(description, searchQuery)}
        </p>

        <div className="ml-14 mb-2 flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          <span>Archived {archivedDate}</span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 ml-14">
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

        {prompt.latestCritique && (
          <div className="ml-14">
            <CritiqueScore
              score={prompt.latestCritique.score}
              size="sm"
              showLabel={false}
            />
          </div>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={handleRestore}
            aria-label={`Restore ${title}`}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 active:scale-95 transition-all duration-100 text-sm font-medium focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            title="Restore from Archive"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Restore</span>
            <span className="sr-only sm:hidden">Restore from archive</span>
          </button>

          <button
            onClick={handleQuickCopy}
            aria-label={copied ? `Copied ${title} to clipboard` : `Copy ${title} to clipboard`}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all duration-100 text-sm font-medium active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2",
              copied
                ? "bg-green-100 text-green-700 focus-visible:ring-green-500"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-500"
            )}
            title="Copy to Clipboard"
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
            onClick={handleDelete}
            aria-label={`Delete ${title} permanently`}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 active:scale-95 transition-all duration-100 text-sm font-medium focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            title="Delete Permanently"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Delete</span>
            <span className="sr-only sm:hidden">Delete permanently</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
});
