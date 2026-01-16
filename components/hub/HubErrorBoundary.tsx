"use client";

import { ReactNode } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useRouter } from "next/navigation";

interface HubErrorBoundaryProps {
  children: ReactNode;
  section: "feed" | "graph" | "filters" | "preview" | "general";
  resetKeys?: Array<string | number>;
}

function getSectionErrorMessage(section: "feed" | "graph" | "filters" | "preview" | "general"): {
  title: string;
  description: string;
  icon: string;
  showBackButton: boolean;
} {
  switch (section) {
    case "feed":
      return {
        title: "Activity Feed encountered an error",
        description:
          "We're having trouble displaying your activity feed. Your artifacts are safe.",
        icon: "📊",
        showBackButton: false,
      };
    case "graph":
      return {
        title: "Knowledge Graph encountered an error",
        description:
          "We're having trouble rendering the graph visualization. Your data is safe.",
        icon: "🌐",
        showBackButton: true,
      };
    case "filters":
      return {
        title: "Filters section encountered an error",
        description:
          "We're having trouble loading filters. Try refreshing the page.",
        icon: "🔍",
        showBackButton: false,
      };
    case "preview":
      return {
        title: "Graph Preview encountered an error",
        description:
          "We're having trouble displaying the graph preview. The full graph may still work.",
        icon: "🗺️",
        showBackButton: false,
      };
    case "general":
    default:
      return {
        title: "The Knowledge Hub encountered an error",
        description:
          "We're having trouble loading this section. Please try refreshing.",
        icon: "🏛️",
        showBackButton: false,
      };
  }
}

export function HubErrorBoundary({
  children,
  section,
  resetKeys,
}: HubErrorBoundaryProps) {
  const router = useRouter();

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`[HubErrorBoundary:${section}]`, error, errorInfo);
  };

  const renderFallback = (error: Error, retry: () => void) => {
    const config = getSectionErrorMessage(section);

    return (
      <div className="bg-bg-secondary border border-red-500/20 rounded-lg p-8 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">{config.icon}</div>
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" aria-hidden="true" />
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
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            aria-label="Try again to load the section"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-tertiary/80 transition-colors text-sm font-medium"
            aria-label="Reload the entire page"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reload Page
          </button>
          {config.showBackButton && (
            <button
              onClick={() => router.push('/hub')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-tertiary/80 transition-colors text-sm font-medium"
              aria-label="Go back to Hub feed"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Feed
            </button>
          )}
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
