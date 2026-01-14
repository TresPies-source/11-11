"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for the TestAgentInterface component
 */
interface TestAgentInterfaceProps {
  /** ID of the agent being tested */
  agentId: string;
  /** Display name of the agent */
  agentName: string;
}

/**
 * Result returned from the routing test API
 */
interface RoutingResult {
  /** ID of the selected agent */
  agent_id: string;
  /** Name of the selected agent */
  agent_name: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Explanation of why this agent was selected */
  reasoning: string;
  /** Whether keyword fallback was used (no LLM call) */
  fallback: boolean;
  /** Token and cost breakdown, null if keyword routing used */
  cost_breakdown: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    total_cost_usd: number;
  } | null;
}

/**
 * TestAgentInterface - Interactive testing UI for validating supervisor routing logic
 * 
 * Features:
 * - Text input for test queries
 * - Real-time routing simulation via API call
 * - Display of selected agent, confidence, and reasoning
 * - Cost breakdown (tokens and USD)
 * - Fallback indicator for keyword routing
 * - Error handling with user-friendly messages
 * 
 * API Integration:
 * - Calls POST /api/agents/test-route
 * - Does not save to database (test-only)
 * 
 * @example
 * ```tsx
 * <TestAgentInterface
 *   agentId="supervisor"
 *   agentName="Supervisor"
 * />
 * ```
 */
export function TestAgentInterface({
  agentId,
  agentName,
}: TestAgentInterfaceProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RoutingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Please enter a query to test");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/agents/test-route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: trimmedQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to test routing");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(cost);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Test Routing Logic
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Enter a query to see which agent the supervisor would route it to.
          This helps validate that your queries are being handled by the right
          agent.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="test-query"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Test Query
          </label>
          <textarea
            id="test-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a test query... (e.g., 'Help me debug a conflict in my codebase')"
            rows={3}
            disabled={isLoading}
            className={cn(
              "w-full px-3 py-2 border rounded-lg resize-none",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
              "border-gray-300 dark:border-gray-600",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={cn(
            "w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2",
            "text-white bg-blue-600 border border-blue-600",
            "hover:bg-blue-700",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Routing Query...
            </>
          ) : (
            "Route Query"
          )}
        </button>
      </form>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
              Error
            </h5>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </motion.div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Routing Result
            </h5>
            {result.fallback && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                Keyword Fallback
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Selected Agent
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {result.agent_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Confidence
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {(result.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Reasoning
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
              {result.reasoning}
            </p>
          </div>

          {result.cost_breakdown && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Cost Breakdown
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Input Tokens:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {result.cost_breakdown.input_tokens.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Output Tokens:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {result.cost_breakdown.output_tokens.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Tokens:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {result.cost_breakdown.total_tokens.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Cost:
                  </span>
                  <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                    {formatCost(result.cost_breakdown.total_cost_usd)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!result.cost_breakdown && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                No cost data available (keyword routing)
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
