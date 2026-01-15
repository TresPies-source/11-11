"use client";

import { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Leaf } from "lucide-react";
import type { SeedType, SeedInsert } from "@/lib/seeds/types";
import { insertSeed } from "@/lib/pglite/seeds";
import { cn } from "@/lib/utils";

interface PlantSeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SEED_TYPES: { value: SeedType; label: string; description: string }[] = [
  { value: "principle", label: "Principle", description: "Core truths & guidelines" },
  { value: "pattern", label: "Pattern", description: "Recurring solutions" },
  { value: "question", label: "Question", description: "Questions to explore" },
  { value: "route", label: "Route", description: "Paths to follow" },
  { value: "artifact", label: "Artifact", description: "Key deliverables" },
  { value: "constraint", label: "Constraint", description: "Limitations & boundaries" },
];

const TYPE_COLORS = {
  principle: {
    bg: "bg-info/10",
    text: "text-info",
    border: "border-info/40",
  },
  pattern: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/40",
  },
  question: {
    bg: "bg-librarian/10",
    text: "text-librarian",
    border: "border-librarian/40",
  },
  route: {
    bg: "bg-dojo/10",
    text: "text-dojo",
    border: "border-dojo/40",
  },
  artifact: {
    bg: "bg-supervisor/10",
    text: "text-supervisor",
    border: "border-supervisor/40",
  },
  constraint: {
    bg: "bg-error/10",
    text: "text-error",
    border: "border-error/40",
  },
};

export const PlantSeedModal = memo(function PlantSeedModal({
  isOpen,
  onClose,
  onSuccess,
}: PlantSeedModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<{
    name: string;
    type: SeedType;
    content: string;
    why_matters: string;
    revisit_when: string;
  }>({
    name: "",
    type: "principle",
    content: "",
    why_matters: "",
    revisit_when: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        type: "principle",
        content: "",
        why_matters: "",
        revisit_when: "",
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isSubmitting, onClose]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    } else if (formData.content.trim().length < 10) {
      newErrors.content = "Content must be at least 10 characters";
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
      const seedData: SeedInsert = {
        name: formData.name.trim(),
        type: formData.type,
        content: formData.content.trim(),
        why_matters: formData.why_matters.trim() || null,
        revisit_when: formData.revisit_when.trim() || null,
        status: "new",
      };

      await insertSeed(seedData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("[PLANT_SEED_MODAL] Error planting seed:", error);
      setErrors({ submit: "Failed to plant seed. Please try again." });
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleCancel}
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-bg-secondary border border-bg-tertiary rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="plant-seed-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-bg-secondary border-b border-bg-tertiary p-6 flex items-start justify-between z-10">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-success" />
                    </div>
                    <h2
                      id="plant-seed-modal-title"
                      className="text-2xl font-bold text-text-primary"
                    >
                      Plant New Seed
                    </h2>
                  </div>
                  <p className="text-sm text-text-tertiary">
                    Capture knowledge for future reference
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary/50 transition-all disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <label
                    htmlFor="seed-name"
                    className="block text-sm font-semibold text-text-primary mb-2"
                  >
                    Name <span className="text-error">*</span>
                  </label>
                  <input
                    id="seed-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    disabled={isSubmitting}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-lg border bg-bg-tertiary text-text-primary",
                      "focus:outline-none focus:ring-2 focus:ring-text-accent focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "placeholder:text-text-muted",
                      errors.name ? "border-error" : "border-bg-elevated"
                    )}
                    placeholder="Give your seed a descriptive name"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "seed-name-error" : undefined}
                  />
                  {errors.name && (
                    <p id="seed-name-error" className="mt-1.5 text-sm text-error">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="seed-type"
                    className="block text-sm font-semibold text-text-primary mb-3"
                  >
                    Type <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {SEED_TYPES.map((type) => {
                      const isSelected = formData.type === type.value;
                      const colors = TYPE_COLORS[type.value];
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, type: type.value }))
                          }
                          disabled={isSubmitting}
                          className={cn(
                            "p-3.5 rounded-lg border-2 text-left transition-all duration-200",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                            isSelected
                              ? `${colors.border} ${colors.bg}`
                              : "border-bg-tertiary bg-bg-tertiary/30 hover:border-bg-elevated"
                          )}
                          aria-pressed={isSelected}
                        >
                          <div
                            className={cn(
                              "font-semibold text-sm mb-1",
                              isSelected ? colors.text : "text-text-primary"
                            )}
                          >
                            {type.label}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            {type.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="seed-content"
                    className="block text-sm font-semibold text-text-primary mb-2"
                  >
                    Content <span className="text-error">*</span>
                  </label>
                  <textarea
                    id="seed-content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, content: e.target.value }))
                    }
                    disabled={isSubmitting}
                    rows={6}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-lg border bg-bg-tertiary text-text-primary font-mono text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-text-accent focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "resize-none placeholder:text-text-muted",
                      errors.content ? "border-error" : "border-bg-elevated"
                    )}
                    placeholder="Enter the main content of your seed"
                    aria-invalid={!!errors.content}
                    aria-describedby={errors.content ? "seed-content-error" : undefined}
                  />
                  {errors.content && (
                    <p id="seed-content-error" className="mt-1.5 text-sm text-error">
                      {errors.content}
                    </p>
                  )}
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
                    value={formData.why_matters}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, why_matters: e.target.value }))
                    }
                    disabled={isSubmitting}
                    rows={3}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-lg border border-bg-elevated bg-bg-tertiary text-text-primary",
                      "focus:outline-none focus:ring-2 focus:ring-text-accent focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "resize-none placeholder:text-text-muted"
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
                    value={formData.revisit_when}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, revisit_when: e.target.value }))
                    }
                    disabled={isSubmitting}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-lg border border-bg-elevated bg-bg-tertiary text-text-primary",
                      "focus:outline-none focus:ring-2 focus:ring-text-accent focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "placeholder:text-text-muted"
                    )}
                    placeholder="When should this seed be revisited? (optional)"
                  />
                </div>

                {errors.submit && (
                  <div className="p-4 rounded-lg bg-error/10 border border-error/30">
                    <p className="text-sm text-error font-medium">{errors.submit}</p>
                  </div>
                )}
              </form>

              <div className="sticky bottom-0 bg-bg-secondary border-t border-bg-tertiary p-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-medium text-text-secondary bg-transparent border border-bg-tertiary hover:border-text-tertiary hover:text-text-primary rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={cn(
                    "px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150 active:scale-95 flex items-center gap-2",
                    "bg-text-accent text-white hover:bg-opacity-90",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-text-accent"
                  )}
                  aria-label="Plant new seed"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Leaf className="w-4 h-4" />
                      </motion.div>
                      Planting...
                    </>
                  ) : (
                    <>
                      <Leaf className="w-4 h-4" />
                      Plant Seed
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
