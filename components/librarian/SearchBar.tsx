"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  showHints?: boolean;
  resultCount?: number;
  searchDuration?: number;
}

const searchHints = [
  "budget planning prompts",
  "time management strategies",
  "creative writing techniques",
  "project management tools",
  "learning productivity",
];

export function SearchBar({
  value,
  onChange,
  onSearch,
  loading = false,
  disabled = false,
  placeholder = "Search prompts semantically...",
  autoFocus = false,
  className,
  showHints = true,
  resultCount,
  searchDuration,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && value.trim() && !loading) {
        e.preventDefault();
        onSearch(value);
      }
      if (e.key === "Escape") {
        onChange("");
        inputRef.current?.blur();
      }
    },
    [value, loading, onSearch, onChange]
  );

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  useEffect(() => {
    if (!showHints || value) return;

    const interval = setInterval(() => {
      setCurrentHint((prev) => (prev + 1) % searchHints.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [showHints, value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("w-full", className)}
    >
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 
              className="h-5 w-5 text-librarian animate-spin" 
              aria-hidden="true" 
            />
          ) : (
            <Search 
              className="h-5 w-5 text-librarian" 
              aria-hidden="true" 
            />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled || loading}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            "block w-full h-14 pl-12 pr-12 text-base",
            "border-2 rounded-xl transition-all duration-200",
            "bg-bg-secondary",
            "text-text-primary",
            "placeholder-text-tertiary",
            isFocused
              ? "border-supervisor ring-4 ring-supervisor/20"
              : "border-bg-tertiary hover:border-supervisor/50",
            disabled && "opacity-50 cursor-not-allowed",
            "focus:outline-none"
          )}
          aria-label="Search prompts by semantic similarity"
          aria-busy={loading}
        />

        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={handleClear}
              disabled={disabled || loading}
              className={cn(
                "absolute inset-y-0 right-0 pr-4 flex items-center",
                "hover:bg-bg-tertiary rounded-r-xl transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-supervisor focus:ring-offset-2"
              )}
              aria-label="Clear search"
            >
              <X className="h-5 w-5 text-text-tertiary hover:text-text-secondary" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {!value && showHints && !isFocused && (
          <motion.div
            key="hints"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="mt-3 flex items-center gap-2 px-1"
          >
            <Sparkles className="h-4 w-4 text-librarian" aria-hidden="true" />
            <p className="text-sm text-text-tertiary">
              Try:{" "}
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentHint}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block italic text-librarian"
                >
                  &ldquo;{searchHints[currentHint]}&rdquo;
                </motion.span>
              </AnimatePresence>
            </p>
          </motion.div>
        )}

        {resultCount !== undefined && resultCount > 0 && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="mt-3 flex items-center gap-3 px-1 text-sm text-text-secondary"
          >
            <span>
              Found <span className="font-semibold text-supervisor">{resultCount}</span>{" "}
              {resultCount === 1 ? "result" : "results"}
            </span>
            {searchDuration !== undefined && (
              <>
                <span className="text-text-muted">•</span>
                <span className="text-text-tertiary">
                  {searchDuration}ms
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
