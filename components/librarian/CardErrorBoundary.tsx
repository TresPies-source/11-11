"use client";

import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

interface CardErrorBoundaryProps {
  children: ReactNode;
  cardType: "seedling" | "greenhouse";
}

export function CardErrorBoundary({ children, cardType }: CardErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`[CardErrorBoundary:${cardType}]`, error, errorInfo);
  };

  const renderFallback = (error: Error, retry: () => void) => {
    return (
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm font-medium mb-1">
            Unable to display {cardType}
          </p>
          <p className="text-gray-500 text-xs mb-3">
            {error.message || "An error occurred"}
          </p>
          <button
            onClick={retry}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
          >
            Try again
          </button>
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
