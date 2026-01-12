"use client";

import { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

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
        title: "Seedlings section encountered an error",
        description:
          "We're having trouble displaying your active prompts. Don't worry, your work is safe.",
        icon: "🌱",
      };
    case "greenhouse":
      return {
        title: "Greenhouse section encountered an error",
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
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
        <div className="text-5xl mb-4">{config.icon}</div>
        <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-amber-900 font-semibold text-lg mb-2">
          {config.title}
        </h3>
        <p className="text-amber-700 text-sm mb-4 max-w-md mx-auto">
          {config.description}
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="bg-white border border-amber-200 rounded-md p-3 mb-4 text-left max-w-lg mx-auto">
            <p className="text-amber-900 text-xs font-mono mb-1">
              <strong>Error:</strong> {error.message}
            </p>
            <p className="text-amber-700 text-xs">
              <strong>Section:</strong> {section}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </button>
        </div>

        <p className="text-amber-600 text-xs mt-4">
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
