"use client";

import { AlertCircle, Loader2 } from "lucide-react";

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
  loading?: boolean;
}

function getErrorGuidance(error: string): string[] {
  const lowerError = error.toLowerCase();

  if (lowerError.includes("network") || lowerError.includes("fetch")) {
    return [
      "Check your internet connection",
      "Try refreshing the page",
      "Verify your firewall settings aren't blocking the connection",
    ];
  }

  if (
    lowerError.includes("auth") ||
    lowerError.includes("unauthorized") ||
    lowerError.includes("permission")
  ) {
    return [
      "Try signing out and back in",
      "Check your Google Drive permissions",
      "Ensure you have access to the workspace",
    ];
  }

  return [
    "Our servers might be experiencing issues",
    "Please try again in a moment",
    "If the problem persists, contact support",
  ];
}

export function ErrorState({
  title,
  message,
  onRetry,
  loading = false,
}: ErrorStateProps) {
  const guidance = getErrorGuidance(message);

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
      <h3 className="text-red-800 font-medium text-lg mb-2">{title}</h3>
      <p className="text-red-600 text-sm mb-4">{message}</p>

      <div className="bg-white border border-red-100 rounded-md p-4 mb-4 text-left max-w-md mx-auto">
        <p className="text-gray-700 text-sm font-medium mb-2">
          Troubleshooting tips:
        </p>
        <ul className="list-disc list-inside space-y-1">
          {guidance.map((tip, index) => (
            <li key={index} className="text-gray-700 text-sm">
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onRetry}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Retrying...
          </>
        ) : (
          "Try Again"
        )}
      </button>
    </div>
  );
}
