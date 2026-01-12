"use client";

import { useEffect } from "react";
import { BookHeart, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LibrarianError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[Librarian Page Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white border border-amber-200 rounded-lg shadow-lg p-8 text-center">
          <BookHeart className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            The Librarian encountered an unexpected error
          </h1>
          <p className="text-gray-600 mb-6">
            We apologize for the inconvenience. The Librarian&apos;s Home experienced
            an error while loading.
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-left">
              <p className="text-red-900 text-sm font-medium mb-2">
                Development Error Details:
              </p>
              <p className="text-red-700 text-xs font-mono break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-red-600 text-xs mt-2">
                  <strong>Digest:</strong> {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-base font-medium"
            >
              <RefreshCw className="h-5 w-5" />
              Try Again
            </button>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-base font-medium"
            >
              <Home className="h-5 w-5" />
              Go Home
            </button>
          </div>

          <p className="text-gray-500 text-sm mt-6">
            If this problem persists, please contact support or try refreshing
            the page.
          </p>
        </div>
      </div>
    </div>
  );
}
