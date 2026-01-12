"use client";

import { useState, memo, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertCircle, Lightbulb } from "lucide-react";
import { CritiqueResult } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CritiqueDetailsProps {
  critique: CritiqueResult;
  className?: string;
}

interface DimensionData {
  key: keyof CritiqueResult['feedback'];
  label: string;
  score: number;
  issues: string[];
  suggestions: string[];
}

const getScoreColor = (score: number) => {
  const percentage = (score / 25) * 100;
  if (percentage < 50) {
    return "text-red-600";
  } else if (percentage < 75) {
    return "text-yellow-600";
  } else {
    return "text-green-600";
  }
};

export const CritiqueDetails = memo(function CritiqueDetails({ critique, className }: CritiqueDetailsProps) {
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(
    new Set()
  );

  const dimensions: DimensionData[] = useMemo(() => [
    {
      key: 'conciseness',
      label: 'Conciseness',
      score: critique.concisenessScore,
      issues: critique.feedback.conciseness.issues,
      suggestions: critique.feedback.conciseness.suggestions,
    },
    {
      key: 'specificity',
      label: 'Specificity',
      score: critique.specificityScore,
      issues: critique.feedback.specificity.issues,
      suggestions: critique.feedback.specificity.suggestions,
    },
    {
      key: 'context',
      label: 'Context',
      score: critique.contextScore,
      issues: critique.feedback.context.issues,
      suggestions: critique.feedback.context.suggestions,
    },
    {
      key: 'taskDecomposition',
      label: 'Task Decomposition',
      score: critique.taskDecompositionScore,
      issues: critique.feedback.taskDecomposition.issues,
      suggestions: critique.feedback.taskDecomposition.suggestions,
    },
  ], [critique]);

  const toggleDimension = useCallback((key: string) => {
    setExpandedDimensions(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      {dimensions.map((dimension) => {
        const isExpanded = expandedDimensions.has(dimension.key);
        const hasContent = dimension.issues.length > 0 || dimension.suggestions.length > 0;

        return (
          <div
            key={dimension.key}
            className="rounded-lg border border-gray-200 bg-white overflow-hidden"
          >
            <button
              onClick={() => toggleDimension(dimension.key)}
              className={cn(
                "w-full px-4 py-3 flex items-center justify-between",
                "hover:bg-gray-50 transition-colors",
                "text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
                !hasContent && "cursor-default"
              )}
              aria-expanded={isExpanded}
              aria-controls={`critique-${dimension.key}-content`}
              aria-label={`${dimension.label}: ${dimension.score} out of 25 points${hasContent ? `, ${isExpanded ? "collapse" : "expand"} details` : ", no feedback available"}`}
              disabled={!hasContent}
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="font-medium text-gray-900">
                  {dimension.label}
                </span>
                <span className={cn("font-semibold tabular-nums text-sm", getScoreColor(dimension.score))}>
                  {dimension.score}/25
                </span>
              </div>
              {hasContent && (
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              )}
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && hasContent && (
                <motion.div
                  id={`critique-${dimension.key}-content`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                  role="region"
                  aria-label={`${dimension.label} feedback details`}
                >
                  <div className="px-4 pb-4 pt-2 space-y-4 border-t border-gray-100">
                    {dimension.issues.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-orange-500" aria-hidden="true" />
                          <h4 className="text-sm font-medium text-gray-700">
                            Issues
                          </h4>
                        </div>
                        <ul className="space-y-1.5 ml-6" aria-label={`${dimension.issues.length} issue${dimension.issues.length !== 1 ? "s" : ""} found`}>
                          {dimension.issues.map((issue, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-gray-600 list-disc"
                            >
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {dimension.suggestions.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-blue-500" aria-hidden="true" />
                          <h4 className="text-sm font-medium text-gray-700">
                            Suggestions
                          </h4>
                        </div>
                        <ul className="space-y-1.5 ml-6" aria-label={`${dimension.suggestions.length} suggestion${dimension.suggestions.length !== 1 ? "s" : ""}`}>
                          {dimension.suggestions.map((suggestion, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-gray-600 list-disc"
                            >
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
});
