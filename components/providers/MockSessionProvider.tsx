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
        avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%234F46E5'/%3E%3Ccircle cx='50' cy='40' r='15' fill='white'/%3E%3Cpath d='M 30 75 Q 30 60 50 60 Q 70 60 70 75 Z' fill='white'/%3E%3C/svg%3E",
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
