"use client";

import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Button } from "@/components/ui/Button";

interface CardErrorBoundaryProps {
  children: ReactNode;
  cardType: "seedling" | "greenhouse" | "archive";
}

const cardTypeLabels: Record<string, string> = {
  seedling: "Active Prompt",
  greenhouse: "Saved Prompt",
  archive: "Archived Prompt",
};

export function CardErrorBoundary({ children, cardType }: CardErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`[CardErrorBoundary:${cardType}]`, error, errorInfo);
  };

  const renderFallback = (error: Error, retry: () => void) => {
    return (
      <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4 min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-text-muted mx-auto mb-2" aria-hidden="true" />
          <p className="text-text-primary text-sm font-medium mb-1">
            Unable to display {cardTypeLabels[cardType] || cardType}
          </p>
          <p className="text-text-secondary text-xs mb-3">
            {error.message || "An error occurred"}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={retry}
            aria-label={`Try again to load ${cardTypeLabels[cardType] || cardType}`}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary fallback={renderFallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}
