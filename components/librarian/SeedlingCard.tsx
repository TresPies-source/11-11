"use client";

import { useState, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sprout } from "lucide-react";
import type { PromptWithCritique } from "@/lib/supabase/prompts";
import { cn } from "@/lib/utils";
import { CritiqueScore } from "./CritiqueScore";

interface SeedlingCardProps {
  prompt: PromptWithCritique;
  onSaveToGreenhouse?: (promptId: string) => void;
  isSaving?: boolean;
}

export const SeedlingCard = memo(function SeedlingCard({ 
  prompt, 
  onSaveToGreenhouse,
  isSaving = false 
}: SeedlingCardProps) {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);

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
      aria-label={`Seedling prompt: ${title}. Score: ${critiqueScore} out of 100${isSaving ? '. Currently being saved.' : ''}`}
      tabIndex={isSaving ? -1 : 0}
      className={cn(
        "group bg-white rounded-lg border border-gray-200 p-4 transition-all duration-200 flex flex-col h-full focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
        isSaving 
          ? "opacity-60 cursor-wait border-green-400" 
          : "hover:shadow-lg hover:border-green-300 cursor-pointer"
      )}
      variants={cardVariants}
      initial="hidden"
      animate={isSaving ? { opacity: 0.6, scale: 0.98 } : "visible"}
      exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.3, ease: "easeInOut" } }}
      whileHover={isSaving ? {} : "hover"}
      onClick={isSaving ? undefined : handleCardClick}
      onKeyDown={isSaving ? undefined : handleKeyPress}
      onHoverStart={() => !isSaving && setIsHovering(true)}
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
              <Sprout className="h-5 w-5 text-green-600 flex-shrink-0" />
            </motion.div>
            <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
              {title}
            </h3>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{description}</p>

        <div className="mb-3">
          <CritiqueScore score={critiqueScore} size="sm" showLabel={true} />
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100">
        <button
          onClick={handleSaveClick}
          disabled={isSaving}
          aria-label={isSaving ? `Saving ${title} to greenhouse` : `Save ${title} to greenhouse`}
          aria-busy={isSaving}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-100 text-sm font-medium",
            isSaving
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700 active:scale-95 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          )}
        >
          <span className="text-base" aria-hidden="true">🌺</span>
          {isSaving ? "Saving..." : "Save to Greenhouse"}
        </button>
      </div>
    </motion.div>
  );
});
