"use client";

import React, { useState } from "react";
import { AgentAvatar } from "@/components/activity/AgentAvatar";
import { ActivityHistory } from "@/components/activity/ActivityHistory";
import { HandoffVisualization } from "@/components/activity/HandoffVisualization";
import { useActivity } from "@/hooks/useActivity";
import { useRoutingActivity, useLibrarianActivity, useActivityTracking } from "@/lib/agents/activity-integration";

export default function TestActivityPage() {
  const { setActivity, clearActivity, addToHistory } = useActivity();
  const { trackRoutingActivity } = useRoutingActivity();
  const { trackLibrarianActivity } = useLibrarianActivity();
  const { withActivityTracking } = useActivityTracking();
  const [progress, setProgress] = useState(0);
  const [queryInput, setQueryInput] = useState("Find prompts about budgeting");
  const [routingResult, setRoutingResult] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("budgeting and finance");
  const [searchResult, setSearchResult] = useState<string>("");
  const [genericResult, setGenericResult] = useState<string>("");

  const simulateActivity = (agentId: string, status: 'active' | 'waiting' | 'complete' | 'error', hasProgress: boolean = false) => {
    setActivity({
      agent_id: agentId,
      status,
      message: `${agentId.charAt(0).toUpperCase() + agentId.slice(1)} is ${status === 'active' ? 'working' : status}...`,
      progress: hasProgress ? progress : undefined,
      started_at: new Date().toISOString(),
      estimated_duration: hasProgress ? 10 : undefined,
    });
  };

  const simulateProgressActivity = () => {
    setActivity({
      agent_id: 'librarian',
      status: 'active',
      message: 'Searching library for relevant prompts...',
      progress: 0,
      started_at: new Date().toISOString(),
      estimated_duration: 15,
    });

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress > 100) {
        clearInterval(interval);
        clearActivity();
      } else {
        setActivity({
          agent_id: 'librarian',
          status: 'active',
          message: currentProgress < 50 ? 'Generating query embedding...' : 'Searching database...',
          progress: currentProgress,
          started_at: new Date().toISOString(),
          estimated_duration: Math.max(5, 15 - Math.floor(currentProgress / 10)),
        });
      }
    }, 1000);
  };

  const addMockHistoryItem = (agentId: string, status: 'idle' | 'active' | 'waiting' | 'complete' | 'error', minutesAgo: number = 0) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - minutesAgo);
    
    addToHistory({
      agent_id: agentId,
      status,
      message: `${agentId.charAt(0).toUpperCase() + agentId.slice(1)} ${status === 'complete' ? 'completed task' : status === 'error' ? 'encountered an error' : 'is ' + status}`,
      started_at: now.toISOString(),
      ended_at: status === 'complete' || status === 'error' ? new Date().toISOString() : undefined,
    });
  };

  const populateHistory = () => {
    addMockHistoryItem('supervisor', 'complete', 15);
    addMockHistoryItem('librarian', 'complete', 12);
    addMockHistoryItem('dojo', 'complete', 10);
    addMockHistoryItem('librarian', 'complete', 8);
    addMockHistoryItem('supervisor', 'error', 5);
    addMockHistoryItem('debugger', 'complete', 3);
    addMockHistoryItem('librarian', 'complete', 2);
    addMockHistoryItem('dojo', 'complete', 1);
  };

  const simulateSimpleHandoff = () => {
    addMockHistoryItem('supervisor', 'complete', 3);
    addMockHistoryItem('librarian', 'complete', 2);
    addMockHistoryItem('dojo', 'complete', 1);
  };

  const simulateComplexHandoff = () => {
    addMockHistoryItem('supervisor', 'complete', 8);
    addMockHistoryItem('librarian', 'complete', 7);
    addMockHistoryItem('librarian', 'complete', 6); // Duplicate (should be filtered)
    addMockHistoryItem('dojo', 'complete', 5);
    addMockHistoryItem('debugger', 'complete', 4);
    addMockHistoryItem('debugger', 'complete', 3); // Duplicate (should be filtered)
    addMockHistoryItem('librarian', 'complete', 2);
    addMockHistoryItem('dojo', 'complete', 1);
  };

  const simulateSingleAgent = () => {
    addMockHistoryItem('supervisor', 'complete', 3);
    addMockHistoryItem('supervisor', 'complete', 2);
    addMockHistoryItem('supervisor', 'complete', 1);
  };

  const testRealRouting = async () => {
    setRoutingResult("Routing...");
    try {
      const result = await trackRoutingActivity(async () => {
        const response = await fetch("/api/supervisor/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: queryInput,
            conversation_context: [],
            session_id: "test-session-activity",
          }),
        });

        if (!response.ok) {
          throw new Error("Routing failed");
        }

        return await response.json();
      });

      setRoutingResult(`✓ Routed to: ${result.agent_name} (${result.agent_id}) - Confidence: ${result.confidence.toFixed(2)}`);
    } catch (error) {
      setRoutingResult(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testLibrarianSearch = async () => {
    setSearchResult("Searching...");
    try {
      const result = await trackLibrarianActivity(async () => {
        const response = await fetch("/api/librarian/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery,
            filters: {
              status: "active",
              threshold: 0.7,
              limit: 5,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        return await response.json();
      });

      if (result.count === 0) {
        setSearchResult(`✓ No results found for "${searchQuery}"`);
      } else {
        const topResult = result.results[0];
        const matchPercent = (topResult.similarity * 100).toFixed(0);
        setSearchResult(`✓ Found ${result.count} result${result.count !== 1 ? 's' : ''} - Top: "${topResult.title}" (${matchPercent}% match) in ${result.duration_ms}ms`);
      }
    } catch (error) {
      setSearchResult(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testGenericActivityTracking = async () => {
    setGenericResult("Processing...");
    try {
      const result = await withActivityTracking(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 3000));
          return {
            success: true,
            insights: ['Insight 1', 'Insight 2', 'Insight 3'],
            duration: 3.0,
          };
        },
        {
          agent_id: 'dojo',
          initial_message: 'Reflecting on perspectives...',
          estimated_duration: 3,
          progress_updates: [
            { delay_ms: 500, progress: 30, message: 'Analyzing context...' },
            { delay_ms: 1500, progress: 70, message: 'Synthesizing insights...' },
          ],
          complete_message: (result) => `Generated ${result.insights.length} insights`,
          error_message: (error) => `Reflection failed: ${error.message}`,
        }
      );

      setGenericResult(`✓ Success: ${result.insights.join(', ')} (${result.duration}s)`);
    } catch (error) {
      setGenericResult(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const { history } = useActivity();

  return (
    <div className="container mx-auto p-8 space-y-12 pb-32">
      <h1 className="text-3xl font-bold mb-8">Activity Components Test</h1>

      <section className="space-y-6 border border-blue-200 dark:border-blue-700 rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20">
        <h2 className="text-2xl font-semibold">🚀 Supervisor Routing Integration Test</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Test the real supervisor routing with activity tracking. Enter a query and click &ldquo;Route Query&rdquo; to see the activity indicators in action.
        </p>
        
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Test Query:</label>
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Enter a query to route..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={testRealRouting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Route Query (Real API)
            </button>
            <button
              onClick={() => setQueryInput("Find prompts about budgeting")}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
            >
              Search Example
            </button>
            <button
              onClick={() => setQueryInput("Help me brainstorm ideas for a startup")}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
            >
              Thinking Example
            </button>
          </div>

          {routingResult && (
            <div className={`p-4 rounded-md text-sm ${routingResult.startsWith('✓') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : routingResult.startsWith('✗') ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'}`}>
              {routingResult}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6 border border-green-200 dark:border-green-700 rounded-lg p-6 bg-green-50 dark:bg-green-900/20">
        <h2 className="text-2xl font-semibold">🔍 Librarian Search Integration Test</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Test the real librarian search with activity tracking. Enter a search query and click &ldquo;Search Library&rdquo; to see the activity indicators with progress updates.
        </p>
        
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Query:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && testLibrarianSearch()}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              placeholder="Enter search query..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={testLibrarianSearch}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Search Library
            </button>
            <button
              onClick={() => setSearchQuery("budgeting and finance")}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
            >
              Budgeting Example
            </button>
            <button
              onClick={() => setSearchQuery("machine learning")}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
            >
              ML Example
            </button>
            <button
              onClick={() => setSearchQuery("react components")}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
            >
              React Example
            </button>
          </div>

          {searchResult && (
            <div className={`p-4 rounded-md text-sm ${searchResult.startsWith('✓') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : searchResult.startsWith('✗') ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'}`}>
              {searchResult}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6 border border-purple-200 dark:border-purple-700 rounded-lg p-6 bg-purple-50 dark:bg-purple-900/20">
        <h2 className="text-2xl font-semibold">🧪 Generic Activity Tracking Test</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Test the generic <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">withActivityTracking()</code> higher-order function. 
          This demonstrates how to wrap any async operation with automatic activity state management, including custom progress updates and completion messages.
        </p>
        
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
            <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Example: Dojo Reflection</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Simulates a Dojo agent reflection with progress updates at 30% and 70%, estimated 3-second duration, and custom completion message.
            </p>
            <button
              onClick={testGenericActivityTracking}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Run Generic Tracking Demo
            </button>
          </div>

          {genericResult && (
            <div className={`p-4 rounded-md text-sm ${genericResult.startsWith('✓') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : genericResult.startsWith('✗') ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'}`}>
              {genericResult}
            </div>
          )}

          <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-4">
            <h3 className="text-xs font-mono font-semibold mb-2 text-gray-700 dark:text-gray-300">Code Example:</h3>
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
{`const { withActivityTracking } = useActivityTracking();

const result = await withActivityTracking(
  async () => {
    // Your async operation here
    return await fetch('/api/agents/dojo', { ... });
  },
  {
    agent_id: 'dojo',
    initial_message: 'Reflecting on perspectives...',
    estimated_duration: 3,
    progress_updates: [
      { delay_ms: 500, progress: 30, message: 'Analyzing context...' },
      { delay_ms: 1500, progress: 70, message: 'Synthesizing insights...' },
    ],
    complete_message: (result) => \`Generated \${result.insights.length} insights\`,
    error_message: (error) => \`Reflection failed: \${error.message}\`,
  }
);`}
            </pre>
          </div>
        </div>
      </section>

      <section className="space-y-6 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
        <h2 className="text-2xl font-semibold">ActivityStatus Component Test</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click buttons below to simulate different activity states. The ActivityStatus component
          will appear at the bottom-right corner of the screen.
        </p>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => simulateActivity('supervisor', 'active', false)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              Supervisor Active
            </button>
            <button
              onClick={() => simulateActivity('dojo', 'active', false)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              Dojo Active
            </button>
            <button
              onClick={() => simulateActivity('librarian', 'active', false)}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
            >
              Librarian Active
            </button>
            <button
              onClick={() => simulateActivity('debugger', 'active', false)}
              className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors text-sm"
            >
              Debugger Active
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => simulateActivity('supervisor', 'active', true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors text-sm"
            >
              With Progress ({progress}%)
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-sm self-center text-gray-600 dark:text-gray-400">{progress}%</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={simulateProgressActivity}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors text-sm"
            >
              Simulate Auto Progress (Librarian)
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => simulateActivity('dojo', 'waiting', false)}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm"
            >
              Waiting State
            </button>
            <button
              onClick={() => simulateActivity('librarian', 'complete', false)}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
            >
              Complete State
            </button>
            <button
              onClick={() => simulateActivity('debugger', 'error', false)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
            >
              Error State
            </button>
          </div>

          <div>
            <button
              onClick={clearActivity}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
            >
              Clear Activity
            </button>
          </div>
        </div>
      </section>

      <h2 className="text-2xl font-semibold mt-12">Agent Avatar Component Test</h2>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Size Variants</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="w-24 text-sm font-medium">Small:</span>
            <AgentAvatar agentId="supervisor" size="sm" />
            <AgentAvatar agentId="dojo" size="sm" />
            <AgentAvatar agentId="librarian" size="sm" />
            <AgentAvatar agentId="debugger" size="sm" />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-24 text-sm font-medium">Medium:</span>
            <AgentAvatar agentId="supervisor" size="md" />
            <AgentAvatar agentId="dojo" size="md" />
            <AgentAvatar agentId="librarian" size="md" />
            <AgentAvatar agentId="debugger" size="md" />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-24 text-sm font-medium">Large:</span>
            <AgentAvatar agentId="supervisor" size="lg" />
            <AgentAvatar agentId="dojo" size="lg" />
            <AgentAvatar agentId="librarian" size="lg" />
            <AgentAvatar agentId="debugger" size="lg" />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Active State</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="w-24 text-sm font-medium">Inactive:</span>
            <AgentAvatar agentId="supervisor" size="md" isActive={false} />
            <AgentAvatar agentId="dojo" size="md" isActive={false} />
            <AgentAvatar agentId="librarian" size="md" isActive={false} />
            <AgentAvatar agentId="debugger" size="md" isActive={false} />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-24 text-sm font-medium">Active:</span>
            <AgentAvatar agentId="supervisor" size="md" isActive={true} />
            <AgentAvatar agentId="dojo" size="md" isActive={true} />
            <AgentAvatar agentId="librarian" size="md" isActive={true} />
            <AgentAvatar agentId="debugger" size="md" isActive={true} />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">With Names</h2>
        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <AgentAvatar agentId="supervisor" size="md" showName />
            <AgentAvatar agentId="dojo" size="md" showName />
            <AgentAvatar agentId="librarian" size="md" showName />
            <AgentAvatar agentId="debugger" size="md" showName />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Active with Names</h2>
        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <AgentAvatar agentId="supervisor" size="md" showName isActive />
            <AgentAvatar agentId="dojo" size="md" showName isActive />
            <AgentAvatar agentId="librarian" size="md" showName isActive />
            <AgentAvatar agentId="debugger" size="md" showName isActive />
          </div>
        </div>
      </section>

      <section className="space-y-6 bg-gray-900 dark:bg-gray-950 p-8 rounded-lg">
        <h2 className="text-2xl font-semibold text-white">Dark Background Test</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <AgentAvatar agentId="supervisor" size="md" showName />
            <AgentAvatar agentId="dojo" size="md" showName />
            <AgentAvatar agentId="librarian" size="md" showName />
            <AgentAvatar agentId="debugger" size="md" showName />
          </div>
          <div className="flex items-center gap-4">
            <AgentAvatar agentId="supervisor" size="md" showName isActive />
            <AgentAvatar agentId="dojo" size="md" showName isActive />
            <AgentAvatar agentId="librarian" size="md" showName isActive />
            <AgentAvatar agentId="debugger" size="md" showName isActive />
          </div>
        </div>
      </section>

      <section className="space-y-6 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
        <h2 className="text-2xl font-semibold">ActivityHistory Component Test</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Test the activity history component with various scenarios.
        </p>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => addMockHistoryItem('supervisor', 'complete', 5)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              Add Supervisor (Complete)
            </button>
            <button
              onClick={() => addMockHistoryItem('librarian', 'complete', 2)}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
            >
              Add Librarian (Complete)
            </button>
            <button
              onClick={() => addMockHistoryItem('dojo', 'error', 1)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
            >
              Add Dojo (Error)
            </button>
            <button
              onClick={() => addMockHistoryItem('debugger', 'waiting', 0)}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm"
            >
              Add Debugger (Waiting)
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={populateHistory}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors text-sm"
            >
              Populate with 8 Activities
            </button>
          </div>
        </div>

        <div className="mt-6">
          <ActivityHistory />
        </div>
      </section>

      <section className="space-y-6 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
        <h2 className="text-2xl font-semibold">HandoffVisualization Component Test</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Test agent path visualization during multi-agent handoffs. The component automatically
          deduplicates consecutive duplicate agents and hides if path length &lt; 2.
        </p>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={simulateSimpleHandoff}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              Simple Handoff (S → L → D)
            </button>
            <button
              onClick={simulateComplexHandoff}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors text-sm"
            >
              Complex Handoff (with duplicates)
            </button>
            <button
              onClick={simulateSingleAgent}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm"
            >
              Single Agent (should hide)
            </button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-white dark:bg-gray-900 p-2 rounded">
            Current path length: {history.filter(a => a.status === 'complete').map(a => a.agent_id).filter((id, i, arr) => i === 0 || id !== arr[i - 1]).length}
          </div>
        </div>

        <div className="mt-6">
          <HandoffVisualization />
        </div>
      </section>

      {/* Performance Testing Section */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Performance Testing
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Test component performance, memory usage, and re-render optimization. Use React DevTools
          Profiler to measure render times and identify unnecessary re-renders.
        </p>
        
        <PerformanceTestSection />
      </section>
    </div>
  );
}

function PerformanceTestSection() {
  const { setActivity, clearActivity, addToHistory } = useActivity();
  const [updateCount, setUpdateCount] = React.useState(0);
  const [isRunning, setIsRunning] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const renderCountRef = React.useRef(0);

  // Track renders without causing re-renders
  renderCountRef.current = renderCountRef.current + 1;

  const runStressTest = React.useCallback(() => {
    setIsRunning(true);
    setUpdateCount(0);
    let count = 0;

    const agents = ['supervisor', 'dojo', 'librarian', 'debugger'] as const;
    const statuses = ['active', 'waiting', 'complete', 'error'] as const;

    intervalRef.current = setInterval(() => {
      count++;
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const randomProgress = Math.floor(Math.random() * 100);

      setActivity({
        agent_id: randomAgent,
        status: randomStatus,
        message: `Test update #${count}: ${randomAgent} - ${randomStatus}`,
        progress: randomProgress,
        started_at: new Date().toISOString(),
        estimated_duration: 5,
      });

      if (randomStatus === 'complete' || randomStatus === 'error') {
        addToHistory({
          agent_id: randomAgent,
          status: randomStatus,
          message: `Test update #${count}: ${randomAgent} - ${randomStatus}`,
          progress: 100,
          started_at: new Date().toISOString(),
        });
      }

      setUpdateCount(count);

      if (count >= 100) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setIsRunning(false);
        clearActivity();
      }
    }, 100); // 100ms interval = 100 updates in 10 seconds
  }, [setActivity, clearActivity, addToHistory]);

  const stopStressTest = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    clearActivity();
  }, [clearActivity]);

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={runStressTest}
          disabled={isRunning}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running...' : 'Run Stress Test (100 updates)'}
        </button>
        <button
          onClick={stopStressTest}
          disabled={!isRunning}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Stop Test
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            Activity Updates
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {updateCount} / 100
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
            Component Renders
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {renderCountRef.current}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            (updates on next action)
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
            Status
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isRunning ? '🏃 Running' : '⏸️ Idle'}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <span>📊</span> Memory Testing Instructions
        </h3>
        <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
          <li>Open Chrome DevTools (F12) → Performance tab</li>
          <li>Click &ldquo;Record&rdquo; and run the stress test</li>
          <li>Wait for 100 updates to complete (10 seconds)</li>
          <li>Stop recording and check memory graph (should be stable, no leaks)</li>
          <li>Expected: Memory increases during test, then stabilizes after cleanup</li>
        </ol>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <span>⚡</span> React DevTools Profiler Instructions
        </h3>
        <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
          <li>Install React DevTools extension (Chrome/Firefox)</li>
          <li>Open DevTools → Profiler tab</li>
          <li>Click &ldquo;Record&rdquo; and run the stress test</li>
          <li>Stop recording after 100 updates</li>
          <li>Check &ldquo;Ranked&rdquo; view to identify components with most renders</li>
          <li>Expected: ActivityStatus, ActivityHistory, HandoffVisualization should show optimized re-renders (with React.memo)</li>
        </ol>
      </div>

      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <span>✅</span> Optimization Checklist
        </h3>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> React.memo applied to AgentAvatar
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> React.memo applied to ActivityHistory
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> React.memo applied to HandoffVisualization
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> React.memo applied to ActivityStatus
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> React.memo applied to Progress
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> useCallback used in ActivityProvider
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> useMemo used for context value
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> useMemo used for computed values
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Animations use ANIMATION_EASE constant
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Animation durations 200-300ms
          </li>
        </ul>
      </div>
    </div>
  );
}
