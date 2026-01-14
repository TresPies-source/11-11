"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X, FolderPlus } from "lucide-react";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export function NewProjectModal({
  isOpen,
  onClose,
  onCreate,
}: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setError(null);

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    onCreate(name.trim(), description.trim());
    onClose();
  }, [name, description, onCreate, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "Enter" && name.trim()) {
        event.preventDefault();
        handleSubmit();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, name, onClose, handleSubmit]);

  if (!mounted) return null;

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-bg-secondary rounded-lg shadow-xl max-w-md w-full border border-bg-tertiary"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <div className="flex items-center justify-between p-4 border-b border-bg-tertiary">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-text-accent" />
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-text-primary"
                  >
                    New Project
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-text-tertiary hover:text-text-primary transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-text-accent"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label
                    htmlFor="project-name-input"
                    className="block text-sm font-medium text-text-secondary mb-1"
                  >
                    Project Name
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
                    placeholder="My Awesome Project"
                    className={cn(
                      "w-full px-3 py-2 bg-bg-tertiary border rounded-lg focus:outline-none focus:ring-2 transition-colors text-text-primary placeholder:text-text-muted",
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
                      className="mt-1 text-sm text-error"
                      role="alert"
                    >
                      {error}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="project-description-input"
                    className="block text-sm font-medium text-text-secondary mb-1"
                  >
                    Project Description
                  </label>
                  <textarea
                    id="project-description-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief description of your project..."
                    rows={4}
                    className="w-full px-3 py-2 bg-bg-tertiary border border-bg-elevated rounded-lg focus:outline-none focus:ring-2 focus:border-text-accent focus:ring-text-accent transition-colors text-text-primary placeholder:text-text-muted resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      "text-text-secondary bg-transparent border border-bg-tertiary hover:border-text-tertiary",
                      "focus:outline-none focus:ring-2 focus:ring-text-accent"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!name.trim()}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      "text-white bg-text-accent hover:bg-opacity-90",
                      "focus:outline-none focus:ring-2 focus:ring-text-accent",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
