"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-md transition-all duration-200",
        "hover:bg-muted",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      type="button"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-foreground transition-transform duration-200 hover:rotate-12" />
      ) : (
        <Sun className="h-5 w-5 text-foreground transition-transform duration-200 hover:rotate-12" />
      )}
    </button>
  );
}
