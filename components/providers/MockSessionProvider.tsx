"use client";

import { createContext, useContext, ReactNode } from "react";
import { User } from "@/lib/types";

interface SessionContextType {
  user: User | null;
  isAuthenticated: boolean;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  isAuthenticated: false,
});

export const useSession = () => useContext(SessionContext);

interface MockSessionProviderProps {
  children: ReactNode;
}

export function MockSessionProvider({ children }: MockSessionProviderProps) {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

  const mockUser: User | null = isDevMode
    ? {
        id: "mock-user-001",
        name: "Dev User",
        email: "dev@11-11.dev",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DevUser",
        provider: "google",
      }
    : null;

  return (
    <SessionContext.Provider
      value={{
        user: mockUser,
        isAuthenticated: isDevMode,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
