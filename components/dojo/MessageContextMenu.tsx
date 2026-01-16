"use client";

import { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { MoreVertical, Save, FileEdit, Code, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { createPrompt } from "@/lib/pglite/prompts";
import { insertSeed } from "@/lib/pglite/seeds";
import { insertKnowledgeLink } from "@/lib/pglite/knowledge-links";
import { useWorkbenchStore } from "@/lib/stores/workbench.store";
import { useRouter } from "next/navigation";
import type { DojoMessage } from "@/lib/stores/dojo.store";
import type { PromptInsert } from "@/lib/pglite/types";
import type { SeedInsert, SeedType } from "@/lib/seeds/types";
import type { KnowledgeLinkInsert } from "@/lib/hub/types";

interface MessageContextMenuProps {
  message: DojoMessage;
  sessionId: string;
}

const SEED_TYPES: { value: SeedType; label: string }[] = [
  { value: "principle", label: "Principle" },
  { value: "pattern", label: "Pattern" },
  { value: "question", label: "Question" },
  { value: "route", label: "Route" },
  { value: "artifact", label: "Artifact" },
  { value: "constraint", label: "Constraint" },
];

export const MessageContextMenu = memo(function MessageContextMenu({
  message,
  sessionId,
}: MessageContextMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { success, error: showError } = useToast();
  const router = useRouter();
  const { addTab } = useWorkbenchStore();

  const [promptForm, setPromptForm] = useState({
    title: "",
    tags: "",
  });

  const [seedForm, setSeedForm] = useState({
    name: "",
    type: "artifact" as SeedType,
    tags: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsPromptModalOpen(false);
        setIsSeedModalOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const extractCodeBlocks = (content: string): Array<{ language: string; code: string }> => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const matches = [];
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      matches.push({
        language: match[1] || "text",
        code: match[2].trim(),
      });
    }
    return matches;
  };

  const hasCodeBlocks = extractCodeBlocks(message.content).length > 0;

  const handleMenuToggle = () => {
    if (!isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSaveAsPrompt = () => {
    setIsMenuOpen(false);
    setPromptForm({
      title: `Message from ${new Date(message.timestamp).toLocaleDateString()}`,
      tags: "",
    });
    setIsPromptModalOpen(true);
  };

  const handleExtractAsSeed = () => {
    setIsMenuOpen(false);
    setSeedForm({
      name: `Message from ${new Date(message.timestamp).toLocaleDateString()}`,
      type: "artifact",
      tags: "",
    });
    setIsSeedModalOpen(true);
  };

  const handleOpenInWorkbench = () => {
    setIsMenuOpen(false);
    const codeBlocks = extractCodeBlocks(message.content);
    
    if (codeBlocks.length === 0) return;

    codeBlocks.forEach((block, index) => {
      const tabId = `code-${message.id}-${index}`;
      const tabTitle = `${block.language || "code"} from Dojo`;
      
      addTab({
        id: tabId,
        title: tabTitle,
        content: block.code,
      });
    });

    success(`✅ Opened ${codeBlocks.length} code block${codeBlocks.length > 1 ? "s" : ""} in Workbench`);
    router.push("/workbench");
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!promptForm.title.trim()) {
      showError("Title is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = "dev@11-11.dev";
      
      const promptData: PromptInsert = {
        user_id: userId,
        title: promptForm.title.trim(),
        content: message.content,
        status: "draft",
        visibility: "private",
      };

      const newPrompt = await createPrompt(promptData);

      const linkData: KnowledgeLinkInsert = {
        source_type: "session",
        source_id: sessionId,
        target_type: "prompt",
        target_id: newPrompt.id,
        relationship: "extracted_from",
        metadata: {
          extraction_type: "message",
          message_id: message.id,
          transfer_timestamp: new Date().toISOString(),
          tags: promptForm.tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
        },
        user_id: userId,
      };

      await insertKnowledgeLink(linkData);

      success("✅ Saved as Prompt!");
      setIsPromptModalOpen(false);
      setPromptForm({ title: "", tags: "" });
    } catch (error) {
      console.error("[MESSAGE_CONTEXT_MENU] Error saving prompt:", error);
      showError(error instanceof Error ? error.message : "Failed to save prompt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!seedForm.name.trim()) {
      showError("Name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = "dev@11-11.dev";
      
      const seedData: SeedInsert = {
        name: seedForm.name.trim(),
        type: seedForm.type,
        content: message.content,
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
          extraction_type: "message",
          message_id: message.id,
          transfer_timestamp: new Date().toISOString(),
          tags: seedForm.tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
        },
        user_id: userId,
      };

      await insertKnowledgeLink(linkData);

      success("✅ Extracted as Seed!");
      setIsSeedModalOpen(false);
      setSeedForm({ name: "", type: "artifact", tags: "" });
    } catch (error) {
      console.error("[MESSAGE_CONTEXT_MENU] Error saving seed:", error);
      showError(error instanceof Error ? error.message : "Failed to extract seed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  const menu = isMenuOpen && (
    <div
      ref={menuRef}
      className="fixed z-50 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-xl min-w-[200px] overflow-hidden"
      style={{
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
      >
        <button
          onClick={handleSaveAsPrompt}
          className="w-full px-4 py-3 text-left hover:bg-bg-tertiary transition-colors flex items-center gap-3 text-sm"
        >
          <Save className="w-4 h-4" />
          <span>Save as Prompt</span>
        </button>

        <button
          onClick={handleExtractAsSeed}
          className="w-full px-4 py-3 text-left hover:bg-bg-tertiary transition-colors flex items-center gap-3 text-sm border-t border-bg-tertiary"
        >
          <FileEdit className="w-4 h-4" />
          <span>Extract as Seed</span>
        </button>

        {hasCodeBlocks && (
          <button
            onClick={handleOpenInWorkbench}
            className="w-full px-4 py-3 text-left hover:bg-bg-tertiary transition-colors flex items-center gap-3 text-sm border-t border-bg-tertiary"
          >
            <Code className="w-4 h-4" />
            <span>Open in Workbench</span>
          </button>
        )}
      </motion.div>
    </div>
  );

  const promptModal = isPromptModalOpen && (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => !isSubmitting && setIsPromptModalOpen(false)}
        />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-bg-primary rounded-lg shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Save className="w-5 h-5 text-dojo" />
                Save as Prompt
              </h3>
              <button
                onClick={() => !isSubmitting && setIsPromptModalOpen(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePromptSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={promptForm.title}
                    onChange={(e) => setPromptForm({ ...promptForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-dojo"
                    placeholder="Enter prompt title..."
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tags <span className="text-text-tertiary">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={promptForm.tags}
                    onChange={(e) => setPromptForm({ ...promptForm, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-dojo"
                    placeholder="tag1, tag2, tag3"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setIsPromptModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "px-4 py-2 text-sm font-medium bg-dojo text-white rounded-lg hover:bg-dojo/90 transition-colors",
                      isSubmitting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? "Saving..." : "Save Prompt"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </>
    </AnimatePresence>
  );

  const seedModal = isSeedModalOpen && (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => !isSubmitting && setIsSeedModalOpen(false)}
        />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-bg-primary rounded-lg shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-dojo" />
                Extract as Seed
              </h3>
              <button
                onClick={() => !isSubmitting && setIsSeedModalOpen(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSeedSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={seedForm.name}
                    onChange={(e) => setSeedForm({ ...seedForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-dojo"
                    placeholder="Enter seed name..."
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Type
                  </label>
                  <select
                    value={seedForm.type}
                    onChange={(e) => setSeedForm({ ...seedForm, type: e.target.value as SeedType })}
                    className="w-full px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-dojo"
                    disabled={isSubmitting}
                  >
                    {SEED_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tags <span className="text-text-tertiary">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={seedForm.tags}
                    onChange={(e) => setSeedForm({ ...seedForm, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-dojo"
                    placeholder="tag1, tag2, tag3"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setIsSeedModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "px-4 py-2 text-sm font-medium bg-dojo text-white rounded-lg hover:bg-dojo/90 transition-colors",
                      isSubmitting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? "Extracting..." : "Extract Seed"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </>
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleMenuToggle}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-bg-tertiary rounded"
        aria-label="Message options"
      >
        <MoreVertical className="w-4 h-4 text-text-tertiary" />
      </button>

      {mounted && menu && createPortal(menu, document.body)}
      {mounted && promptModal && createPortal(promptModal, document.body)}
      {mounted && seedModal && createPortal(seedModal, document.body)}
    </>
  );
});
