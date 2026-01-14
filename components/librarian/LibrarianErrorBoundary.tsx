"use client";

import { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Button } from "@/components/ui/Button";

interface LibrarianErrorBoundaryProps {
  children: ReactNode;
  section: "seedling" | "greenhouse" | "general";
  resetKeys?: Array<string | number>;
}

function getSectionErrorMessage(section: "seedling" | "greenhouse" | "general"): {
  title: string;
  description: string;
  icon: string;
} {
  switch (section) {
    case "seedling":
      return {
        title: "Active Prompts section encountered an error",
        description:
          "We're having trouble displaying your active prompts. Don't worry, your work is safe.",
        icon: "🌱",
      };
    case "greenhouse":
      return {
        title: "Saved Prompts section encountered an error",
        description:
          "We're having trouble displaying your saved prompts. Don't worry, your library is safe.",
        icon: "🌺",
      };
    case "general":
    default:
      return {
        title: "The Librarian encountered an error",
        description:
          "We're having trouble loading this section. Please try refreshing.",
        icon: "📚",
      };
  }
}

export function LibrarianErrorBoundary({
  children,
  section,
  resetKeys,
}: LibrarianErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`[LibrarianErrorBoundary:${section}]`, error, errorInfo);
  };

  const renderFallback = (error: Error, retry: () => void) => {
    const config = getSectionErrorMessage(section);

    return (
      <div className="bg-bg-secondary border border-warning rounded-lg p-8 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">{config.icon}</div>
        <AlertTriangle className="h-10 w-10 text-warning mx-auto mb-3" aria-hidden="true" />
        <h3 className="text-text-primary font-semibold text-lg mb-2">
          {config.title}
        </h3>
        <p className="text-text-secondary text-sm mb-4 max-w-md mx-auto">
          {config.description}
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="bg-bg-primary border border-bg-tertiary rounded-md p-3 mb-4 text-left max-w-lg mx-auto">
            <p className="text-text-primary text-xs font-mono mb-1">
              <strong>Error:</strong> {error.message}
            </p>
            <p className="text-text-secondary text-xs">
              <strong>Section:</strong> {section}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            variant="primary"
            size="sm"
            onClick={retry}
            aria-label="Try again to load the section"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
            aria-label="Reload the entire page"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reload Page
          </Button>
        </div>

        <p className="text-text-tertiary text-xs mt-4">
          If this problem persists, please refresh the page or contact support.
        </p>
      </div>
    );
  };

  return (
    <ErrorBoundary
      fallback={renderFallback}
      onError={handleError}
      resetKeys={resetKeys}
    >
      {children}
    </ErrorBoundary>
  );
}
