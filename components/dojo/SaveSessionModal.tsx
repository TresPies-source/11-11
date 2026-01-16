"use client";

import { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Save, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { createPrompt } from "@/lib/pglite/prompts";
import { insertSeed } from "@/lib/pglite/seeds";
import { insertKnowledgeLink } from "@/lib/pglite/knowledge-links";
import type { PromptInsert } from "@/lib/pglite/types";
import type { SeedInsert, SeedType } from "@/lib/seeds/types";
import type { KnowledgeLinkInsert } from "@/lib/hub/types";
import type { DojoMessage } from "@/lib/stores/dojo.store";

interface SaveSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sessionId: string;
  messages: DojoMessage[];
}

type ExtractionType = "full_conversation" | "selected_messages" | "code_artifacts";

interface SavedArtifact {
  type: "prompt" | "seed";
  id: string;
  name: string;
}

const SEED_TYPES: { value: SeedType; label: string }[] = [
  { value: "principle", label: "Principle" },
  { value: "pattern", label: "Pattern" },
  { value: "question", label: "Question" },
  { value: "route", label: "Route" },
  { value: "artifact", label: "Artifact" },
  { value: "constraint", label: "Constraint" },
];

export const SaveSessionModal = memo(function SaveSessionModal({
  isOpen,
  onClose,
  onSuccess,
  sessionId,
  messages,
}: SaveSessionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { success, error: showError } = useToast();

  const [extractionTypes, setExtractionTypes] = useState<Set<ExtractionType>>(
    new Set<ExtractionType>(["full_conversation"])
  );
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set<string>());
  const [saveAsPrompt, setSaveAsPrompt] = useState(true);
  const [formData, setFormData] = useState<{
    title: string;
    tags: string;
    isPublic: boolean;
    seedType: SeedType;
  }>({
    title: "",
    tags: "",
    isPublic: false,
    seedType: "principle",
  });

  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    message: "",
  });
  const [savedArtifacts, setSavedArtifacts] = useState<SavedArtifact[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setExtractionTypes(new Set<ExtractionType>(["full_conversation"]));
      setSelectedMessageIds(new Set<string>());
      setSaveAsPrompt(true);
      setFormData({
        title: "",
        tags: "",
        isPublic: false,
        seedType: "principle",
      });
      setErrors({});
      setIsSubmitting(false);
      setProgress({ current: 0, total: 0, message: "" });
      setSavedArtifacts([]);
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

  const toggleExtractionType = (type: ExtractionType) => {
    const newTypes = new Set(extractionTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setExtractionTypes(newTypes);
  };

  const toggleMessageSelection = (messageId: string) => {
    const newSelection = new Set(selectedMessageIds);
    if (newSelection.has(messageId)) {
      newSelection.delete(messageId);
    } else {
      newSelection.add(messageId);
    }
    setSelectedMessageIds(newSelection);
  };

  const extractCodeBlocks = (content: string): string[] => {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const matches = [];
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      matches.push(match[1].trim());
    }
    return matches;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (extractionTypes.size === 0) {
      newErrors.extraction = "Select at least one extraction type";
    }

    if (extractionTypes.has("selected_messages") && selectedMessageIds.size === 0) {
      newErrors.messages = "Select at least one message";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
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
    setSavedArtifacts([]);

    try {
      const userId = "dev@11-11.dev";
      const artifacts: SavedArtifact[] = [];

      if (extractionTypes.has("full_conversation")) {
        setProgress({ current: 1, total: 1, message: "Saving full conversation..." });

        const conversationContent = messages
          .map((msg) => `[${msg.role.toUpperCase()}]: ${msg.content}`)
          .join("\n\n");

        if (saveAsPrompt) {
          const promptData: PromptInsert = {
            user_id: userId,
            title: formData.title.trim(),
            content: conversationContent,
            status: "draft",
            visibility: formData.isPublic ? "public" : "private",
          };

          const newPrompt = await createPrompt(promptData);

          const linkData: KnowledgeLinkInsert = {
            source_type: "session",
            source_id: sessionId,
            target_type: "prompt",
            target_id: newPrompt.id,
            relationship: "extracted_from",
            metadata: {
              extraction_type: "full_conversation",
              transfer_timestamp: new Date().toISOString(),
              tags: formData.tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
            },
            user_id: userId,
          };

          await insertKnowledgeLink(linkData);
          artifacts.push({ type: "prompt", id: newPrompt.id, name: formData.title });
        } else {
          const seedData: SeedInsert = {
            name: formData.title.trim(),
            type: formData.seedType,
            content: conversationContent,
            status: "new",
            user_id: userId,
          };

          const newSeed = await insertSeed(seedData);

          const linkData: KnowledgeLinkInsert = {
            source_type: "session",
            source_id: sessionId,
            target_type: "seed",
            target_id: newSeed.id,
            relationship: "extracted_from",
            metadata: {
              extraction_type: "full_conversation",
              transfer_timestamp: new Date().toISOString(),
              tags: formData.tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
            },
            user_id: userId,
          };

          await insertKnowledgeLink(linkData);
          artifacts.push({ type: "seed", id: newSeed.id, name: formData.title });
        }
      }

      if (extractionTypes.has("selected_messages") && selectedMessageIds.size > 0) {
        const selectedMessages = messages.filter((msg) => selectedMessageIds.has(msg.id));
        const total = selectedMessages.length;

        for (let i = 0; i < total; i++) {
          const msg = selectedMessages[i];
          setProgress({
            current: i + 1,
            total,
            message: `Saving message ${i + 1} of ${total}...`,
          });

          const seedName = `Message from ${msg.role} - ${new Date(msg.timestamp).toLocaleDateString()}`;
          const seedData: SeedInsert = {
            name: seedName,
            type: "artifact",
            content: msg.content,
            status: "new",
            user_id: userId,
          };

          const newSeed = await insertSeed(seedData);

          const linkData: KnowledgeLinkInsert = {
            source_type: "session",
            source_id: sessionId,
            target_type: "seed",
            target_id: newSeed.id,
            relationship: "extracted_from",
            metadata: {
              extraction_type: "selected_message",
              message_id: msg.id,
              transfer_timestamp: new Date().toISOString(),
              tags: formData.tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
            },
            user_id: userId,
          };

          await insertKnowledgeLink(linkData);
          artifacts.push({ type: "seed", id: newSeed.id, name: seedName });
        }
      }

      if (extractionTypes.has("code_artifacts")) {
        const codeBlocks: Array<{ messageId: string; code: string; index: number }> = [];

        messages.forEach((msg) => {
          const blocks = extractCodeBlocks(msg.content);
          blocks.forEach((code, index) => {
            codeBlocks.push({ messageId: msg.id, code, index });
          });
        });

        const total = codeBlocks.length;

        for (let i = 0; i < total; i++) {
          const { messageId, code, index } = codeBlocks[i];
          setProgress({
            current: i + 1,
            total,
            message: `Saving code block ${i + 1} of ${total}...`,
          });

          const seedName = `Code Block ${index + 1} - ${formData.title}`;
          const seedData: SeedInsert = {
            name: seedName,
            type: "artifact",
            content: code,
            status: "new",
            user_id: userId,
          };

          const newSeed = await insertSeed(seedData);

          const linkData: KnowledgeLinkInsert = {
            source_type: "session",
            source_id: sessionId,
            target_type: "seed",
            target_id: newSeed.id,
            relationship: "extracted_from",
            metadata: {
              extraction_type: "code_block",
              message_id: messageId,
              transfer_timestamp: new Date().toISOString(),
              tags: formData.tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
            },
            user_id: userId,
          };

          await insertKnowledgeLink(linkData);
          artifacts.push({ type: "seed", id: newSeed.id, name: seedName });
        }
      }

      setSavedArtifacts(artifacts);
      success(`✅ Saved ${artifacts.length} artifact${artifacts.length !== 1 ? "s" : ""}!`);
      onSuccess();
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("[SAVE_SESSION_MODAL] Error saving session:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save session";
      setErrors({ submit: errorMessage });
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setProgress({ current: 0, total: 0, message: "" });
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!mounted) return null;

  const agentMessages = messages.filter((msg) => msg.role === "agent");
  const showMessagePicker = extractionTypes.has("selected_messages");
  const hasCodeBlocks = messages.some((msg) => extractCodeBlocks(msg.content).length > 0);

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
              className="bg-bg-primary rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="save-session-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-bg-primary border-b border-bg-tertiary p-6 flex items-start justify-between z-10">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Save className="w-5 h-5 text-dojo" />
                    <h2
                      id="save-session-modal-title"
                      className="text-2xl font-bold text-text-primary"
                    >
                      Save Dojo Session
                    </h2>
                  </div>
                  <p className="text-sm text-text-muted">
                    Extract knowledge from your conversation
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

              {savedArtifacts.length > 0 ? (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <CheckCircle className="w-16 h-16 text-success" />
                    <h3 className="text-xl font-bold text-text-primary">
                      Successfully Saved!
                    </h3>
                    <p className="text-text-muted">
                      {savedArtifacts.length} artifact{savedArtifacts.length !== 1 ? "s" : ""}{" "}
                      saved to Knowledge Hub
                    </p>
                    <div className="w-full max-w-md space-y-2">
                      {savedArtifacts.map((artifact, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg bg-bg-secondary border border-bg-tertiary"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                artifact.type === "prompt" ? "bg-accent" : "bg-success"
                              )}
                            />
                            <span className="text-sm font-medium text-text-primary">
                              {artifact.name}
                            </span>
                            <span className="ml-auto text-xs text-text-muted">
                              {artifact.type === "prompt" ? "Prompt" : "Seed"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex-1 overflow-y-auto p-6 space-y-6"
                >
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      What to extract <span className="text-error">*</span>
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 p-3 rounded-lg border border-bg-tertiary bg-bg-secondary hover:bg-muted/10 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={extractionTypes.has("full_conversation")}
                          onChange={() => toggleExtractionType("full_conversation")}
                          disabled={isSubmitting}
                          className="mt-0.5 w-4 h-4 rounded border-bg-tertiary text-dojo focus:ring-2 focus:ring-dojo disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-text-primary">
                            Full conversation
                          </div>
                          <div className="text-xs text-text-muted">
                            Save the entire conversation as a single artifact
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 rounded-lg border border-bg-tertiary bg-bg-secondary hover:bg-muted/10 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={extractionTypes.has("selected_messages")}
                          onChange={() => toggleExtractionType("selected_messages")}
                          disabled={isSubmitting}
                          className="mt-0.5 w-4 h-4 rounded border-bg-tertiary text-dojo focus:ring-2 focus:ring-dojo disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-text-primary">
                            Selected messages
                          </div>
                          <div className="text-xs text-text-muted">
                            Extract individual messages as separate Seeds
                          </div>
                        </div>
                      </label>

                      {hasCodeBlocks && (
                        <label className="flex items-start gap-3 p-3 rounded-lg border border-bg-tertiary bg-bg-secondary hover:bg-muted/10 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={extractionTypes.has("code_artifacts")}
                            onChange={() => toggleExtractionType("code_artifacts")}
                            disabled={isSubmitting}
                            className="mt-0.5 w-4 h-4 rounded border-bg-tertiary text-dojo focus:ring-2 focus:ring-dojo disabled:opacity-50"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-text-primary">
                              Code artifacts
                            </div>
                            <div className="text-xs text-text-muted">
                              Extract all code blocks as separate Seeds
                            </div>
                          </div>
                        </label>
                      )}
                    </div>
                    {errors.extraction && (
                      <p className="mt-2 text-sm text-error">{errors.extraction}</p>
                    )}
                  </div>

                  {showMessagePicker && (
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-3">
                        Select messages <span className="text-error">*</span>
                      </label>
                      <div className="max-h-48 overflow-y-auto space-y-2 border border-bg-tertiary rounded-lg p-3">
                        {agentMessages.length === 0 ? (
                          <p className="text-sm text-text-muted text-center py-4">
                            No agent messages available
                          </p>
                        ) : (
                          agentMessages.map((msg) => (
                            <label
                              key={msg.id}
                              className="flex items-start gap-3 p-2 rounded hover:bg-muted/10 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedMessageIds.has(msg.id)}
                                onChange={() => toggleMessageSelection(msg.id)}
                                disabled={isSubmitting}
                                className="mt-0.5 w-4 h-4 rounded border-bg-tertiary text-dojo focus:ring-2 focus:ring-dojo disabled:opacity-50"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-text-primary truncate">
                                  {msg.content.slice(0, 100)}
                                  {msg.content.length > 100 ? "..." : ""}
                                </div>
                                <div className="text-xs text-text-muted">
                                  {new Date(msg.timestamp).toLocaleString()}
                                </div>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                      {errors.messages && (
                        <p className="mt-2 text-sm text-error">{errors.messages}</p>
                      )}
                    </div>
                  )}

                  {extractionTypes.has("full_conversation") && (
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-3">
                        Save full conversation as
                      </label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setSaveAsPrompt(true)}
                          disabled={isSubmitting}
                          className={cn(
                            "flex-1 p-4 rounded-lg border-2 text-center transition-all duration-150",
                            "hover:scale-105 active:scale-100",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                            saveAsPrompt
                              ? "border-accent bg-accent/10"
                              : "border-bg-tertiary bg-bg-secondary hover:border-bg-tertiary/60"
                          )}
                          aria-pressed={saveAsPrompt}
                        >
                          <div
                            className={cn(
                              "font-semibold text-lg mb-1",
                              saveAsPrompt ? "text-accent" : "text-text-primary"
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
                          onClick={() => setSaveAsPrompt(false)}
                          disabled={isSubmitting}
                          className={cn(
                            "flex-1 p-4 rounded-lg border-2 text-center transition-all duration-150",
                            "hover:scale-105 active:scale-100",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                            !saveAsPrompt
                              ? "border-success bg-success/10"
                              : "border-bg-tertiary bg-bg-secondary hover:border-bg-tertiary/60"
                          )}
                          aria-pressed={!saveAsPrompt}
                        >
                          <div
                            className={cn(
                              "font-semibold text-lg mb-1",
                              !saveAsPrompt ? "text-success" : "text-text-primary"
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
                  )}

                  {!saveAsPrompt && extractionTypes.has("full_conversation") && (
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">
                        Seed Type <span className="text-error">*</span>
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
                  )}

                  <div>
                    <label
                      htmlFor="session-title"
                      className="block text-sm font-semibold text-text-primary mb-2"
                    >
                      Title <span className="text-error">*</span>
                    </label>
                    <input
                      id="session-title"
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      disabled={isSubmitting}
                      className={cn(
                        "w-full px-4 py-2 rounded-lg border bg-bg-secondary text-text-primary",
                        "focus:outline-none focus:ring-2 focus:ring-dojo focus:border-transparent",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        errors.title ? "border-error" : "border-bg-tertiary"
                      )}
                      placeholder="Give this extraction a descriptive title"
                      aria-invalid={!!errors.title}
                      aria-describedby={errors.title ? "session-title-error" : undefined}
                    />
                    {errors.title && (
                      <p id="session-title-error" className="mt-1 text-sm text-error">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="session-tags"
                      className="block text-sm font-semibold text-text-primary mb-2"
                    >
                      Tags
                    </label>
                    <input
                      id="session-tags"
                      type="text"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, tags: e.target.value }))
                      }
                      disabled={isSubmitting}
                      className={cn(
                        "w-full px-4 py-2 rounded-lg border border-bg-tertiary bg-bg-secondary text-text-primary",
                        "focus:outline-none focus:ring-2 focus:ring-dojo focus:border-transparent",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                      placeholder="Comma-separated tags (e.g., discussion, insights, code)"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="session-public"
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isPublic: e.target.checked,
                        }))
                      }
                      disabled={isSubmitting}
                      className="w-4 h-4 rounded border-bg-tertiary text-dojo focus:ring-2 focus:ring-dojo disabled:opacity-50"
                    />
                    <label
                      htmlFor="session-public"
                      className="text-sm font-medium text-text-primary"
                    >
                      Make this public
                    </label>
                  </div>

                  {isSubmitting && progress.total > 0 && (
                    <div className="p-4 rounded-lg bg-bg-secondary border border-bg-tertiary">
                      <div className="flex items-center gap-3 mb-2">
                        <Loader2 className="w-4 h-4 text-dojo animate-spin" />
                        <span className="text-sm text-text-primary">
                          {progress.message}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-dojo transition-all duration-300"
                          style={{
                            width: `${(progress.current / progress.total) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-text-muted text-right mt-1">
                        {progress.current} / {progress.total}
                      </div>
                    </div>
                  )}

                  {errors.submit && (
                    <div className="p-3 rounded-lg bg-error/10 border border-error/30">
                      <p className="text-sm text-error">{errors.submit}</p>
                    </div>
                  )}
                </form>
              )}

              {savedArtifacts.length === 0 && (
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
                    className="px-4 py-2 text-sm font-medium bg-dojo text-white hover:bg-dojo/90 rounded-lg transition-all duration-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
});
