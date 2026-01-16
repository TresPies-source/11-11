"use client";

import { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { createPrompt } from "@/lib/pglite/prompts";
import { insertSeed } from "@/lib/pglite/seeds";
import { insertKnowledgeLink } from "@/lib/pglite/knowledge-links";
import type { PromptInsert, PromptVisibility } from "@/lib/pglite/types";
import type { SeedInsert, SeedType, SeedStatus } from "@/lib/seeds/types";
import type { KnowledgeLinkInsert } from "@/lib/hub/types";

interface SaveArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  content: string;
  title?: string;
  sourceFileId?: string;
}

const SEED_TYPES: { value: SeedType; label: string }[] = [
  { value: "principle", label: "Principle" },
  { value: "pattern", label: "Pattern" },
  { value: "question", label: "Question" },
  { value: "route", label: "Route" },
  { value: "artifact", label: "Artifact" },
  { value: "constraint", label: "Constraint" },
];

const SEED_STATUSES: { value: SeedStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "growing", label: "Growing" },
  { value: "mature", label: "Mature" },
  { value: "compost", label: "Compost" },
];

export const SaveArtifactModal = memo(function SaveArtifactModal({
  isOpen,
  onClose,
  onSuccess,
  content,
  title = "",
  sourceFileId,
}: SaveArtifactModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { success, error: showError } = useToast();

  const [targetType, setTargetType] = useState<"prompt" | "seed">("prompt");
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    tags: string;
    isPublic: boolean;
    seedType: SeedType;
    seedStatus: SeedStatus;
    whyMatters: string;
    revisitWhen: string;
  }>({
    name: title || "",
    description: "",
    tags: "",
    isPublic: false,
    seedType: "principle",
    seedStatus: "new",
    whyMatters: "",
    revisitWhen: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setTargetType("prompt");
      setFormData({
        name: title || "",
        description: "",
        tags: "",
        isPublic: false,
        seedType: "principle",
        seedStatus: "new",
        whyMatters: "",
        revisitWhen: "",
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, title]);

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
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!content || content.trim().length === 0) {
      newErrors.content = "Content cannot be empty";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = 'dev@11-11.dev';
      let targetId: string;

      if (targetType === "prompt") {
        const visibility: PromptVisibility = formData.isPublic ? "public" : "private";
        
        const promptData: PromptInsert = {
          user_id: userId,
          title: formData.name.trim(),
          content: content,
          status: 'draft',
          visibility,
        };

        console.log(`[SAVE_ARTIFACT_MODAL] Creating prompt: ${promptData.title}`);
        const newPrompt = await createPrompt(promptData);
        targetId = newPrompt.id;
        console.log(`[SAVE_ARTIFACT_MODAL] Created prompt ${targetId}`);
      } else {
        const seedData: SeedInsert = {
          name: formData.name.trim(),
          type: formData.seedType,
          content: content,
          status: formData.seedStatus,
          why_matters: formData.whyMatters.trim() || null,
          revisit_when: formData.revisitWhen.trim() || null,
          user_id: userId,
        };

        console.log(`[SAVE_ARTIFACT_MODAL] Creating seed: ${seedData.name}`);
        const newSeed = await insertSeed(seedData);
        targetId = newSeed.id;
        console.log(`[SAVE_ARTIFACT_MODAL] Created seed ${targetId}`);
      }

      if (sourceFileId) {
        const linkData: KnowledgeLinkInsert = {
          source_type: 'file',
          source_id: sourceFileId,
          target_type: targetType,
          target_id: targetId,
          relationship: 'extracted_from',
          metadata: {
            transfer_timestamp: new Date().toISOString(),
            description: formData.description.trim() || undefined,
            tags: formData.tags.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0),
          },
          user_id: userId,
        };

        console.log(`[SAVE_ARTIFACT_MODAL] Creating knowledge link`);
        const link = await insertKnowledgeLink(linkData);
        console.log(`[SAVE_ARTIFACT_MODAL] Created knowledge link ${link.id}`);
      }

      success(
        `✅ Saved as ${targetType === "prompt" ? "Prompt" : "Seed"}!`
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error("[SAVE_ARTIFACT_MODAL] Error saving artifact:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save artifact";
      setErrors({ submit: errorMessage });
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
              aria-labelledby="save-artifact-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-bg-primary border-b border-bg-tertiary p-6 flex items-start justify-between z-10">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Save className="w-5 h-5 text-accent" />
                    <h2
                      id="save-artifact-modal-title"
                      className="text-2xl font-bold text-text-primary"
                    >
                      Save to Knowledge Hub
                    </h2>
                  </div>
                  <p className="text-sm text-text-muted">
                    Save this content as a Prompt or Seed for future reference
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
                  <label className="block text-sm font-semibold text-text-primary mb-3">
                    Save as <span className="text-error">*</span>
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setTargetType("prompt")}
                      disabled={isSubmitting}
                      className={cn(
                        "flex-1 p-4 rounded-lg border-2 text-center transition-all duration-150",
                        "hover:scale-105 active:scale-100",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                        targetType === "prompt"
                          ? "border-accent bg-accent/10"
                          : "border-bg-tertiary bg-bg-secondary hover:border-bg-tertiary/60"
                      )}
                      aria-pressed={targetType === "prompt"}
                    >
                      <div
                        className={cn(
                          "font-semibold text-lg mb-1",
                          targetType === "prompt"
                            ? "text-accent"
                            : "text-text-primary"
                        )}
                      >
                        Prompt
                      </div>
                      <div className="text-xs text-text-muted">
                        Reusable prompt template
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType("seed")}
                      disabled={isSubmitting}
                      className={cn(
                        "flex-1 p-4 rounded-lg border-2 text-center transition-all duration-150",
                        "hover:scale-105 active:scale-100",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                        targetType === "seed"
                          ? "border-success bg-success/10"
                          : "border-bg-tertiary bg-bg-secondary hover:border-bg-tertiary/60"
                      )}
                      aria-pressed={targetType === "seed"}
                    >
                      <div
                        className={cn(
                          "font-semibold text-lg mb-1",
                          targetType === "seed"
                            ? "text-success"
                            : "text-text-primary"
                        )}
                      >
                        Seed
                      </div>
                      <div className="text-xs text-text-muted">
                        Knowledge to nurture
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="artifact-name"
                    className="block text-sm font-semibold text-text-primary mb-2"
                  >
                    Name <span className="text-error">*</span>
                  </label>
                  <input
                    id="artifact-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    disabled={isSubmitting}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg border bg-bg-secondary text-text-primary",
                      "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      errors.name ? "border-error" : "border-bg-tertiary"
                    )}
                    placeholder="Give your artifact a descriptive name"
                    aria-invalid={!!errors.name}
                    aria-describedby={
                      errors.name ? "artifact-name-error" : undefined
                    }
                  />
                  {errors.name && (
                    <p id="artifact-name-error" className="mt-1 text-sm text-error">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="artifact-description"
                    className="block text-sm font-semibold text-text-primary mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id="artifact-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    rows={3}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg border border-bg-tertiary bg-bg-secondary text-text-primary",
                      "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "resize-none"
                    )}
                    placeholder="Brief description (optional)"
                  />
                </div>

                <div>
                  <label
                    htmlFor="artifact-tags"
                    className="block text-sm font-semibold text-text-primary mb-2"
                  >
                    Tags
                  </label>
                  <input
                    id="artifact-tags"
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tags: e.target.value }))
                    }
                    disabled={isSubmitting}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg border border-bg-tertiary bg-bg-secondary text-text-primary",
                      "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    placeholder="Comma-separated tags (e.g., coding, python, tutorial)"
                  />
                </div>

                {targetType === "seed" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">
                        Type <span className="text-error">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {SEED_TYPES.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                seedType: type.value,
                              }))
                            }
                            disabled={isSubmitting}
                            className={cn(
                              "p-2 rounded-lg border text-sm transition-all duration-150",
                              "hover:scale-105 active:scale-100",
                              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                              formData.seedType === type.value
                                ? "border-success bg-success/10 text-success"
                                : "border-bg-tertiary bg-bg-secondary text-text-primary hover:border-bg-tertiary/60"
                            )}
                            aria-pressed={formData.seedType === type.value}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">
                        Status <span className="text-error">*</span>
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {SEED_STATUSES.map((status) => (
                          <button
                            key={status.value}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                seedStatus: status.value,
                              }))
                            }
                            disabled={isSubmitting}
                            className={cn(
                              "p-2 rounded-lg border text-sm transition-all duration-150",
                              "hover:scale-105 active:scale-100",
                              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                              formData.seedStatus === status.value
                                ? "border-success bg-success/10 text-success"
                                : "border-bg-tertiary bg-bg-secondary text-text-primary hover:border-bg-tertiary/60"
                            )}
                            aria-pressed={formData.seedStatus === status.value}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="seed-why-matters"
                        className="block text-sm font-semibold text-text-primary mb-2"
                      >
                        Why it matters
                      </label>
                      <textarea
                        id="seed-why-matters"
                        value={formData.whyMatters}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            whyMatters: e.target.value,
                          }))
                        }
                        disabled={isSubmitting}
                        rows={3}
                        className={cn(
                          "w-full px-4 py-2 rounded-lg border border-bg-tertiary bg-bg-secondary text-text-primary",
                          "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "resize-none"
                        )}
                        placeholder="Explain why this seed is important (optional)"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="seed-revisit-when"
                        className="block text-sm font-semibold text-text-primary mb-2"
                      >
                        Revisit when
                      </label>
                      <input
                        id="seed-revisit-when"
                        type="text"
                        value={formData.revisitWhen}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            revisitWhen: e.target.value,
                          }))
                        }
                        disabled={isSubmitting}
                        className={cn(
                          "w-full px-4 py-2 rounded-lg border border-bg-tertiary bg-bg-secondary text-text-primary",
                          "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                        placeholder="When should this seed be revisited? (optional)"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <input
                    id="artifact-public"
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isPublic: e.target.checked,
                      }))
                    }
                    disabled={isSubmitting}
                    className="w-4 h-4 rounded border-bg-tertiary text-accent focus:ring-2 focus:ring-accent disabled:opacity-50"
                  />
                  <label
                    htmlFor="artifact-public"
                    className="text-sm font-medium text-text-primary"
                  >
                    Make this public
                  </label>
                </div>

                {errors.submit && (
                  <div className="p-3 rounded-lg bg-error/10 border border-error/30">
                    <p className="text-sm text-error">{errors.submit}</p>
                  </div>
                )}
              </form>

              <div className="sticky bottom-0 bg-bg-primary border-t border-bg-tertiary p-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-text-secondary bg-muted/20 hover:bg-muted/30 rounded-lg transition-all duration-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-100 active:scale-95",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    targetType === "prompt"
                      ? "bg-accent text-white hover:bg-accent/90"
                      : "bg-success text-white hover:bg-success/90"
                  )}
                >
                  {isSubmitting ? "Saving..." : "Save"}
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
