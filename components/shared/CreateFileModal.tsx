"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { validateFileName } from "@/lib/validation";
import { X, File, Folder, Loader2 } from "lucide-react";

interface CreateFileModalProps {
  isOpen: boolean;
  type: "file" | "folder";
  existingNames?: string[];
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function CreateFileModal({
  isOpen,
  type,
  existingNames = [],
  onClose,
  onCreate,
}: CreateFileModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setError(null);
      setIsLoading(false);
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async () => {
    if (error || !name.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onCreate(name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setIsLoading(false);
    }
  }, [error, name, isLoading, onCreate, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "Enter" && !error && name.trim()) {
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
  }, [isOpen, name, error, onClose, handleSubmit]);

  useEffect(() => {
    if (name.trim()) {
      const validation = validateFileName(name);
      if (!validation.valid) {
        setError(validation.error || "Invalid name");
        return;
      }

      const normalizedName = name.trim().toLowerCase();
      const isDuplicate = existingNames.some(
        (existingName) => existingName.toLowerCase() === normalizedName
      );
      
      if (isDuplicate) {
        setError(`A ${type} with this name already exists`);
        return;
      }

      setError(null);
    } else {
      setError(null);
    }
  }, [name, existingNames, type]);

  if (!mounted) return null;

  const Icon = type === "file" ? File : Folder;
  const title = type === "file" ? "Create New File" : "Create New Folder";
  const placeholder = type === "file" ? "my-prompt.md" : "folder-name";

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
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    {title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label
                    htmlFor="file-name-input"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    ref={inputRef}
                    id="file-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    placeholder={placeholder}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors",
                      error
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
                      isLoading && "bg-gray-50 cursor-not-allowed"
                    )}
                    aria-invalid={!!error}
                    aria-describedby={error ? "name-error" : undefined}
                  />
                  {error && (
                    <p
                      id="name-error"
                      className="mt-1 text-sm text-red-600"
                      role="alert"
                    >
                      {error}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      "text-gray-700 bg-gray-100 hover:bg-gray-200",
                      "focus:outline-none focus:ring-2 focus:ring-gray-500",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!!error || !name.trim() || isLoading}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      "text-white bg-blue-600 hover:bg-blue-700",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "flex items-center gap-2"
                    )}
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
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
