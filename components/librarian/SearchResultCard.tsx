"use client";

import { memo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Calendar, Tag as TagIcon, User, ExternalLink } from "lucide-react";
import type { SearchResult } from "@/lib/librarian/search";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";

interface SearchResultCardProps {
  result: SearchResult;
  index: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString();
}

function getSimilarityColor(similarity: number): string {
  if (similarity >= 0.9) return "text-white bg-success border-success";
  if (similarity >= 0.8) return "text-white bg-success border-success";
  if (similarity >= 0.7) return "text-white bg-info border-info";
  return "text-white bg-supervisor border-supervisor";
}

function getSimilarityLabel(similarity: number): string {
  if (similarity >= 0.95) return "Excellent match";
  if (similarity >= 0.9) return "Very strong match";
  if (similarity >= 0.85) return "Strong match";
  if (similarity >= 0.8) return "Good match";
  if (similarity >= 0.75) return "Relevant";
  return "Related";
}

export const SearchResultCard = memo(function SearchResultCard({
  result,
  index,
}: SearchResultCardProps) {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = useCallback(() => {
    router.push(`/?loadPrompt=${result.id}`);
  }, [router, result.id]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const similarityPercentage = Math.round(result.similarity * 100);
  const similarityColor = getSimilarityColor(result.similarity);
  const similarityLabel = getSimilarityLabel(result.similarity);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.2, 
        delay: index * 0.05,
        ease: "easeOut" 
      }}
      role="article"
      aria-label={`Search result: ${result.title}. ${similarityPercentage}% match`}
      tabIndex={0}
      className={cn(
        "group cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-supervisor focus-visible:ring-offset-2"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyPress}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
    >
      <Card glow={true} className="h-full">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <motion.div
              animate={{
                scale: isHovering ? 1.1 : 1,
                rotate: isHovering ? 5 : 0,
              }}
              transition={{ duration: 0.2 }}
              aria-hidden="true"
            >
              <FileText className="h-6 w-6 text-librarian flex-shrink-0 mt-0.5" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-text-primary group-hover:text-supervisor transition-colors line-clamp-2">
                {result.title}
              </h3>
              {result.metadata.description && (
                <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                  {result.metadata.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.1 }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
                similarityColor
              )}
              title={similarityLabel}
            >
              <span className="text-base leading-none">{similarityPercentage}%</span>
            </motion.div>
          </div>
        </div>

        <p className="text-sm text-text-tertiary mb-4 line-clamp-3 leading-relaxed">
          {result.content.slice(0, 200)}
          {result.content.length > 200 ? "..." : ""}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-text-tertiary">
          {result.metadata.author && (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{result.metadata.author}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{formatDate(result.metadata.updated_at)}</span>
          </div>

          {result.metadata.tags && result.metadata.tags.length > 0 && (
            <div className="flex items-center gap-1.5">
              <TagIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <div className="flex gap-1.5">
                {result.metadata.tags.slice(0, 3).map((tag, i) => (
                  <Tag key={i} label={tag} />
                ))}
                {result.metadata.tags.length > 3 && (
                  <span className="text-text-tertiary">
                    +{result.metadata.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovering ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-auto flex items-center gap-1.5 text-supervisor font-medium"
          >
            <span>Open</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
});
