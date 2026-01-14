"use client";

import { createContext, useState, useCallback, ReactNode, useEffect, useMemo } from "react";
import { AgentActivity, ActivityContextValue } from "@/lib/types";
import { logEvent, isTraceActive } from "@/lib/harness/trace";

const STORAGE_KEY = "agent-activity-history";
const MAX_HISTORY_ITEMS = 10;

export const ActivityContext = createContext<ActivityContextValue | null>(null);

interface ActivityProviderProps {
  children: ReactNode;
}

export function ActivityProvider({ children }: ActivityProviderProps) {
  const [current, setCurrent] = useState<AgentActivity | null>(null);
  const [history, setHistory] = useState<AgentActivity[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(-MAX_HISTORY_ITEMS));
        }
      }
    } catch (error) {
      console.warn("[ActivityProvider] Failed to load history from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.warn("[ActivityProvider] Failed to save history to localStorage:", error);
      }
    }
  }, [history]);

  const setActivity = useCallback((activity: AgentActivity) => {
    setCurrent(activity);

    if (isTraceActive()) {
      try {
        logEvent(
          "AGENT_ACTIVITY_START",
          {
            agent_id: activity.agent_id,
            message: activity.message,
          },
          {},
          {
            progress: activity.progress,
            estimated_duration: activity.estimated_duration,
          }
        );
      } catch (error) {
        console.warn("[ActivityProvider] Failed to log AGENT_ACTIVITY_START:", error);
      }
    }
  }, []);

  const updateActivity = useCallback((updates: Partial<AgentActivity>) => {
    setCurrent((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };

      if (isTraceActive()) {
        try {
          logEvent(
            "AGENT_ACTIVITY_PROGRESS",
            {
              agent_id: updated.agent_id,
              message: updated.message,
            },
            {},
            {
              progress: updated.progress,
              estimated_duration: updated.estimated_duration,
            }
          );
        } catch (error) {
          console.warn("[ActivityProvider] Failed to log AGENT_ACTIVITY_PROGRESS:", error);
        }
      }

      return updated;
    });
  }, []);

  const clearActivity = useCallback(() => {
    setCurrent(null);
  }, []);

  const addToHistory = useCallback((activity: AgentActivity) => {
    setHistory((prev) => {
      const updated = [...prev, activity].slice(-MAX_HISTORY_ITEMS);
      return updated;
    });

    if (isTraceActive()) {
      try {
        logEvent(
          "AGENT_ACTIVITY_COMPLETE",
          {
            agent_id: activity.agent_id,
            message: activity.message,
          },
          {},
          {
            progress: activity.progress,
            status: activity.status,
          }
        );
      } catch (error) {
        console.warn("[ActivityProvider] Failed to log AGENT_ACTIVITY_COMPLETE:", error);
      }
    }
  }, []);

  const contextValue = useMemo<ActivityContextValue>(
    () => ({
      current,
      history,
      setActivity,
      updateActivity,
      clearActivity,
      addToHistory,
    }),
    [current, history, setActivity, updateActivity, clearActivity, addToHistory]
  );

  return (
    <ActivityContext.Provider value={contextValue}>
      {children}
    </ActivityContext.Provider>
  );
}
