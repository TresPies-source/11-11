"use client";

import { useState, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Globe, Eye, User } from "lucide-react";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CritiqueScore } from "./CritiqueScore";
import { PublicBadge } from "./PublicBadge";
import { CopyToLibraryButton } from "./CopyToLibraryButton";

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffInDays / 365)} year${Math.floor(diffInDays / 365) > 1 ? 's' : ''} ago`;
}

interface CommonsPromptCardProps {
  prompt: PromptWithCritique;
  currentUserId?: string;
  onCopyComplete?: () => void;
}

export const CommonsPromptCard = memo(function CommonsPromptCard({
  prompt,
  currentUserId,
  onCopyComplete,
}: CommonsPromptCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const isOwner = currentUserId && prompt.author_id === currentUserId;
  const title = prompt.title;
  const description = prompt.content.split("\n").slice(0, 3).join(" ").slice(0, 150) + "...";
  const authorName = prompt.author_name || "Anonymous";
  const publishedAt = prompt.published_at
    ? formatDistanceToNow(new Date(prompt.published_at))
    : "recently";

  const handleCardClick = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleEdit = useCallback(() => {
    if (isOwner) {
      router.push(`/librarian/greenhouse?edit=${prompt.id}`);
    }
  }, [isOwner, router, prompt.id]);

  return (
    <motion.div
      layoutId={`commons-card-${prompt.id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="article"
      aria-label={`Public prompt: ${title} by ${authorName}`}
      className="cursor-pointer"
      onClick={handleCardClick}
    >
      <Card glow={true} className="group flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Globe className="h-5 w-5 text-info flex-shrink-0" aria-hidden="true" />
              <h3 className="font-sans font-semibold text-text-primary group-hover:text-info transition-colors line-clamp-2">
                {title}
              </h3>
            </div>
            <PublicBadge variant="compact" />
          </div>

          <p className="text-sm text-text-secondary mb-3 line-clamp-3">{description}</p>

          <div className="flex items-center gap-3 text-xs text-text-tertiary mb-3">
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              <span>by {authorName}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Published {publishedAt}</span>
            </div>
          </div>

          {isExpanded && (
            <div className="mb-3 p-3 bg-bg-secondary rounded-md border border-bg-tertiary">
              <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                {prompt.content}
              </pre>
            </div>
          )}

          <div className="mb-3">
            <CritiqueScore score={prompt.latestCritique?.score ?? 0} size="sm" showLabel={true} />
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-bg-tertiary space-y-2">
          {isOwner ? (
            <Button
              variant="secondary"
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              aria-label={`View your public prompt: ${title}`}
              className="w-full"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              View My Prompt
            </Button>
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              <CopyToLibraryButton
                promptId={prompt.id}
                onCopyComplete={onCopyComplete}
                className="w-full"
              />
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="w-full text-xs text-text-tertiary hover:text-text-secondary py-1 transition-colors"
            aria-label={isExpanded ? "Collapse prompt content" : "Expand prompt content"}
          >
            {isExpanded ? "Show less" : "Show full prompt"}
          </button>
        </div>
      </Card>
    </motion.div>
  );
});
