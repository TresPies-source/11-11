"use client";

import { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { createSessionFromContext } from "@/lib/hub/context-injection";

interface DiscussWithDojoModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileContent: string;
  fileName?: string;
  fileId?: string;
}

const PLACEHOLDER_SUGGESTIONS = [
  "Can you help me refactor this code?",
  "What are some edge cases I should consider?",
  "How can I improve the performance of this?",
  "Can you explain what this code does?",
  "What tests should I write for this?",
];

export const DiscussWithDojoModal = memo(function DiscussWithDojoModal({
  isOpen,
  onClose,
  fileContent,
  fileName = "Untitled",
  fileId,
}: DiscussWithDojoModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const { success, error: showError } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuestion("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const validateForm = (): boolean => {
    if (!question.trim()) {
      setError("Please enter a question or topic to discuss");
      return false;
    }

    if (question.trim().length < 5) {
      setError("Question must be at least 5 characters");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = 'dev@11-11.dev';
      const contentPreview = fileContent.substring(0, 1000);
      
      const situation = `${question.trim()}\n\nFile: ${fileName}`;
      const perspectives = [
        `File content (first 1000 chars):\n\`\`\`\n${contentPreview}\n\`\`\``,
      ];

      console.log('[DISCUSS_WITH_DOJO_MODAL] Creating session from workbench file:', fileName);
      
      const result = await createSessionFromContext({
        artifact_type: 'file',
        artifact_id: fileId || 'workbench-file',
        situation,
        perspectives,
        user_id: userId,
        title: `Discussion about ${fileName}`,
      });

      console.log('[DISCUSS_WITH_DOJO_MODAL] Session created:', result.session_id);
      
      success("✅ Started Dojo session!");
      onClose();
      router.push(`/dojo/${result.session_id}`);
    } catch (error) {
      console.error("[DISCUSS_WITH_DOJO_MODAL] Error creating session:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create session";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

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
            onClick={handleCancel}
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-bg-primary rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="discuss-with-dojo-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-bg-primary border-b border-bg-tertiary p-6 flex items-start justify-between z-10">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-5 h-5 text-accent" />
                    <h2
                      id="discuss-with-dojo-modal-title"
                      className="text-2xl font-bold text-text-primary"
                    >
                      Discuss with Dojo
                    </h2>
                  </div>
                  <p className="text-sm text-text-muted">
                    Start a conversation about <span className="font-semibold text-text-primary">{fileName}</span>
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="p-2 rounded-md text-text-muted hover:text-text-secondary hover:bg-muted/20 transition-colors disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto p-6 space-y-6"
              >
                <div>
                  <label
                    htmlFor="discussion-question"
                    className="block text-sm font-semibold text-text-primary mb-2"
                  >
                    What would you like to discuss about this file? <span className="text-error">*</span>
                  </label>
                  <textarea
                    id="discussion-question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={isSubmitting}
                    rows={6}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border bg-bg-secondary text-text-primary",
                      "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "resize-none",
                      error ? "border-error" : "border-bg-tertiary"
                    )}
                    placeholder={PLACEHOLDER_SUGGESTIONS[Math.floor(Math.random() * PLACEHOLDER_SUGGESTIONS.length)]}
                    aria-invalid={!!error}
                    aria-describedby={
                      error ? "discussion-question-error" : undefined
                    }
                  />
                  {error && (
                    <p id="discussion-question-error" className="mt-1 text-sm text-error">
                      {error}
                    </p>
                  )}
                </div>

                <div className="bg-bg-secondary/50 rounded-lg p-4 border border-bg-tertiary">
                  <p className="text-xs text-text-muted mb-2">
                    💡 <span className="font-semibold">Tip:</span> The first 1000 characters of your file will be shared with Dojo as context.
                  </p>
                  <div className="text-xs text-text-muted font-mono bg-bg-primary/50 rounded p-2 max-h-32 overflow-y-auto">
                    {fileContent.substring(0, 200)}
                    {fileContent.length > 200 && "..."}
                  </div>
                </div>
              </form>

              <div className="sticky bottom-0 bg-bg-primary border-t border-bg-tertiary p-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className={cn(
                    "px-6 py-2.5 rounded-lg font-medium transition-all duration-150",
                    "border border-bg-tertiary text-text-primary",
                    "hover:bg-bg-secondary active:scale-98",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={cn(
                    "px-6 py-2.5 rounded-lg font-medium transition-all duration-150",
                    "bg-accent text-white shadow-sm",
                    "hover:bg-accent/90 active:scale-98",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center gap-2"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      Start Discussion
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
});
