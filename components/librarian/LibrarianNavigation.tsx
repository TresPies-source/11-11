"use client";

import { motion } from "framer-motion";
import { Leaf, Globe, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LibrarianNavigationProps {
  savedPromptsCount: number;
}

export function LibrarianNavigation({ savedPromptsCount }: LibrarianNavigationProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.05 }}
      className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
      aria-label="Librarian navigation"
    >
      <a
        href="/librarian/greenhouse"
        className={cn(
          "group relative overflow-hidden rounded-lg border-2 border-bg-tertiary",
          "bg-bg-secondary",
          "p-6 transition-all duration-200",
          "hover:border-success hover:shadow-lg hover:scale-[1.02]",
          "focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2"
        )}
        aria-label={`Navigate to Saved Prompts. ${savedPromptsCount} ${savedPromptsCount === 1 ? 'prompt' : 'prompts'} saved`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-sans font-bold text-text-primary flex items-center gap-2 mb-2">
              <Leaf className="h-6 w-6 text-success" aria-hidden="true" />
              Saved Prompts
            </h2>
            <p className="text-text-secondary text-sm">
              Your cultivated prompts ready to bloom
            </p>
            <p className="text-success font-medium text-sm mt-2">
              {savedPromptsCount} {savedPromptsCount === 1 ? 'prompt' : 'prompts'} saved
            </p>
          </div>
          <ArrowRight className="h-6 w-6 text-success transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </div>
      </a>

      <a
        href="/librarian/commons"
        className={cn(
          "group relative overflow-hidden rounded-lg border-2 border-bg-tertiary",
          "bg-bg-secondary",
          "p-6 transition-all duration-200",
          "hover:border-info hover:shadow-lg hover:scale-[1.02]",
          "focus:outline-none focus:ring-2 focus:ring-info focus:ring-offset-2"
        )}
        aria-label="Navigate to Global Commons to discover community prompts"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-sans font-bold text-text-primary flex items-center gap-2 mb-2">
              <Globe className="h-6 w-6 text-info" aria-hidden="true" />
              The Global Commons
            </h2>
            <p className="text-text-secondary text-sm">
              Discover prompts shared by the community
            </p>
            <p className="text-info font-medium text-sm mt-2">
              Explore public prompts
            </p>
          </div>
          <ArrowRight className="h-6 w-6 text-info transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </div>
      </a>
    </motion.nav>
  );
}
