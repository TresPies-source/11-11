"use client";

import React, { useState, lazy, Suspense } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Network, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTrace } from "@/hooks/useTrace";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";

const TraceTreeView = lazy(() =>
  import("@/components/harness").then((mod) => ({ default: mod.TraceTreeView }))
);
const TraceTimelineView = lazy(() =>
  import("@/components/harness").then((mod) => ({ default: mod.TraceTimelineView }))
);
const TraceSummaryView = lazy(() =>
  import("@/components/harness").then((mod) => ({ default: mod.TraceSummaryView }))
);

type ViewMode = "tree" | "timeline" | "summary";

export default function TracePage() {
  const params = useParams();
  const traceId = params.traceId as string;
  const [viewMode, setViewMode] = useState<ViewMode>("tree");

  const { data: trace, loading, error, retry } = useTrace({ traceId });

  if (loading && !trace) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link
              href="/traces"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Traces
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Network className="h-8 w-8 text-blue-600 dark:text-blue-500" />
              Trace Viewer
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Inspect the execution tree of your Dojo session
            </p>
          </div>
          <LoadingState count={1} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link
              href="/traces"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Traces
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Network className="h-8 w-8 text-blue-600 dark:text-blue-500" />
              Trace Viewer
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Inspect the execution tree of your Dojo session
            </p>
          </div>
          <ErrorState
            title="Unable to load trace"
            message={error}
            onRetry={retry}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  if (!trace) {
    return null;
  }

  const tabs: { id: ViewMode; label: string }[] = [
    { id: "tree", label: "Tree View" },
    { id: "timeline", label: "Timeline View" },
    { id: "summary", label: "Summary" },
  ];

  const isLargeTrace = trace.summary.total_events > 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/traces"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
            aria-label="Go back to traces list"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Traces
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Network className="h-8 w-8 text-blue-600 dark:text-blue-500" aria-hidden="true" />
            Trace Viewer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Inspect the execution tree of your Dojo session
          </p>
        </div>

        {isLargeTrace && (
          <motion.div
            className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Large Trace Detected
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  This trace contains {trace.summary.total_events} events. Rendering may be slower
                  than usual. Consider using the Summary view for a high-level overview.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mb-6">
          <div
            className="flex gap-2 border-b border-gray-200 dark:border-gray-800"
            role="tablist"
            aria-label="Trace visualization views"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                role="tab"
                aria-selected={viewMode === tab.id}
                aria-controls={`${tab.id}-panel`}
                tabIndex={viewMode === tab.id ? 0 : -1}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors relative",
                  viewMode === tab.id
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                {tab.label}
                {viewMode === tab.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    layoutId="activeTab"
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          role="tabpanel"
          id={`${viewMode}-panel`}
          aria-labelledby={`${viewMode}-tab`}
        >
          <Suspense fallback={<LoadingState count={1} />}>
            {viewMode === "tree" && <TraceTreeView trace={trace} />}
            {viewMode === "timeline" && <TraceTimelineView trace={trace} />}
            {viewMode === "summary" && <TraceSummaryView trace={trace} />}
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
