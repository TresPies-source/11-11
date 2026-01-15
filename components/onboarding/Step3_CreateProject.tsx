"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FolderPlus, ArrowLeft, CheckCircle } from "lucide-react";

interface Step3_CreateProjectProps {
  onComplete: (name: string, description: string) => void;
  onBack: () => void;
}

export function Step3_CreateProject({
  onComplete,
  onBack,
}: Step3_CreateProjectProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    onComplete(name.trim(), description.trim());
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && name.trim()) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="p-6 space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-text-accent/10 mb-2">
          <FolderPlus className="w-8 h-8 text-text-accent" />
        </div>
        <h3 className="text-xl font-bold text-text-primary">
          Create Your First Project
        </h3>
        <p className="text-text-secondary">
          Let&apos;s get started with your first project
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="project-name-input"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            Project Name <span className="text-error">*</span>
          </label>
          <input
            ref={nameInputRef}
            id="project-name-input"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="My Awesome Project"
            className={cn(
              "w-full px-4 py-3 bg-bg-tertiary border rounded-lg focus:outline-none focus:ring-2 transition-colors text-text-primary placeholder:text-text-muted",
              error
                ? "border-error focus:border-error focus:ring-error"
                : "border-bg-elevated focus:border-text-accent focus:ring-text-accent"
            )}
            aria-invalid={!!error}
            aria-describedby={error ? "name-error" : undefined}
          />
          {error && (
            <p
              id="name-error"
              className="mt-2 text-sm text-error flex items-center gap-1"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="project-description-input"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            Project Description <span className="text-text-muted text-xs">(optional)</span>
          </label>
          <textarea
            id="project-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of your project..."
            rows={4}
            className="w-full px-4 py-3 bg-bg-tertiary border border-bg-elevated rounded-lg focus:outline-none focus:ring-2 focus:border-text-accent focus:ring-text-accent transition-colors text-text-primary placeholder:text-text-muted resize-none"
          />
        </div>

        <div className="p-4 rounded-lg bg-info/10 border border-info/20">
          <p className="text-sm text-text-secondary">
            💡 <span className="font-medium text-text-primary">Tip:</span> You
            can create more projects later from the dashboard
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2",
            "text-text-secondary bg-transparent border border-bg-tertiary hover:border-text-tertiary",
            "focus:outline-none focus:ring-2 focus:ring-text-accent"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className={cn(
            "px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 inline-flex items-center gap-2",
            "text-white bg-text-accent hover:bg-opacity-90",
            "focus:outline-none focus:ring-2 focus:ring-text-accent focus:ring-offset-2 focus:ring-offset-bg-secondary",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transform hover:scale-105"
          )}
        >
          <CheckCircle className="w-4 h-4" />
          Complete Setup
        </button>
      </div>
    </motion.div>
  );
}
