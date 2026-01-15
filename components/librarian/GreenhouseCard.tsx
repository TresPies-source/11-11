"use client";

import { useState, memo, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { CritiqueScore } from "./CritiqueScore";
import { CritiqueDetails } from "./CritiqueDetails";
import { PublicToggle } from "./PublicToggle";
import { PublicBadge } from "./PublicBadge";
import { GreenhouseCardActions } from "./GreenhouseCardActions";

interface GreenhouseCardProps {
  prompt: PromptWithCritique;
  searchQuery?: string;
  onStatusChange?: () => void;
}

export const GreenhouseCard = memo(function GreenhouseCard({ prompt, searchQuery, onStatusChange }: GreenhouseCardProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

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
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/60 text-gray-900 dark:text-yellow-100 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  const handleCardClick = useCallback(() => {
    router.push(`/librarian/${prompt.id}`);
  }, [router, prompt.id]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  }, [handleCardClick]);

  const critiqueScore = useMemo(() => prompt.latestCritique?.score ?? 0, [prompt.latestCritique?.score]);

  return (
    <motion.div
      layoutId={`prompt-card-${prompt.id}`}
      layout
      role="article"
      aria-label={`Saved prompt: ${title}. Score: ${critiqueScore} out of 100. ${tags.length > 0 ? `Tags: ${tags.join(", ")}` : ""}`}
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyPress}
      className="cursor-pointer focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{
        layout: { duration: 0.2, ease: "easeInOut" },
        duration: 0.2,
      }}
    >
      <Card glow={true} className="group flex flex-col h-full">
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0" role="img" aria-label="saved prompt">
              🌺
            </span>
            <h3 className="font-semibold text-text-primary group-hover:text-librarian transition-colors line-clamp-2 flex-1">
              {highlightText(title, searchQuery)}
            </h3>
          </div>
          {prompt.visibility === 'public' && <PublicBadge variant="compact" />}
        </div>

        <p className="text-sm text-text-secondary mb-3 line-clamp-3 ml-10">
          {highlightText(description, searchQuery)}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 ml-10">
            {tags.map((tag, index) => (
              <Tag 
                key={index} 
                label={tag}
              />
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

      <div onClick={(e) => e.stopPropagation()} className="mt-auto pt-3 border-t border-bg-tertiary space-y-2">
        <PublicToggle
          promptId={prompt.id}
          visibility={prompt.visibility}
          authorName={prompt.author_name || 'Anonymous'}
          className="w-full"
        />
      </div>

      <GreenhouseCardActions
        promptId={prompt.id}
        promptTitle={title}
        promptContent={prompt.content}
        driveFileId={prompt.drive_file_id || null}
        onStatusChange={onStatusChange}
      />
      </Card>
    </motion.div>
  );
});
