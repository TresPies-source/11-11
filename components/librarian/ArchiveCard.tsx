"use client";

import { useState, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, RotateCcw, Trash2, Clock } from "lucide-react";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { CritiqueScore } from "./CritiqueScore";

interface ArchiveCardProps {
  prompt: PromptWithCritique;
  selected: boolean;
  onSelect: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  searchQuery?: string;
}

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

  return (
    <motion.div
      layoutId={`archive-card-${prompt.id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ duration: 0.2 }}
      role="article"
      aria-label={`Archived prompt: ${title}. Archived on ${archivedDate}. ${selected ? 'Selected' : 'Not selected'}. ${tags.length > 0 ? `Tags: ${tags.join(", ")}` : ""}`}
      tabIndex={0}
      className="cursor-pointer"
      onClick={handleCardClick}
      onKeyDown={handleKeyPress}
    >
      <Card
        glow={true}
        className={cn(
          "group flex flex-col h-full",
          selected && "ring-2 ring-info bg-bg-secondary"
        )}
      >
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                type="checkbox"
                checked={selected}
                onChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
                className="h-5 w-5 text-info border-bg-tertiary rounded focus:ring-2 focus:ring-info cursor-pointer flex-shrink-0"
                aria-label={`Select ${title}`}
              />
              <span className="text-2xl flex-shrink-0" role="img" aria-label="archived prompt">
                📦
              </span>
              <h3 className="font-sans font-semibold text-text-primary group-hover:text-text-secondary transition-colors line-clamp-2 flex-1">
                {highlightText(title, searchQuery)}
              </h3>
            </div>
          </div>

          <p className="text-sm text-text-secondary mb-3 ml-14 line-clamp-3">
            {highlightText(description, searchQuery)}
          </p>

          <div className="ml-14 mb-2 flex items-center gap-1.5 text-xs text-text-tertiary">
            <Clock className="h-3.5 w-3.5" />
            <span>Archived {archivedDate}</span>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 ml-14">
              {tags.map((tag, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Tag label={highlightText(tag, searchQuery) as string} />
                </motion.div>
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

        <div className="mt-auto pt-3 border-t border-bg-tertiary">
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRestore}
              aria-label={`Restore ${title} from archive`}
              className="flex-1 bg-success hover:bg-success/90"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Restore</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleQuickCopy}
              aria-label={copied ? `Copied ${title} to clipboard` : `Copy ${title} to clipboard`}
              className={cn("flex-1", copied && "bg-success/20 text-success border-success")}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDelete}
              aria-label={`Delete ${title} permanently`}
              className="flex-1 bg-error hover:bg-error/90"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});
