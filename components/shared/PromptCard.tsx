"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Copy, Check, PlayCircle, Download, Edit, FileEdit, MessageSquare } from "lucide-react";
import { PromptFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { useWorkbenchStore } from "@/lib/stores/workbench.store";
import { createSessionFromContext } from "@/lib/hub/context-injection";
import { TrailOfThoughtPanel } from "@/components/hub/TrailOfThoughtPanel";

interface PromptCardProps {
  prompt: PromptFile;
  variant: "library" | "gallery" | "greenhouse" | "commons";
  onTagClick?: (tag: string) => void;
}

export function PromptCard({ prompt, variant, onTagClick }: PromptCardProps) {
  const router = useRouter();
  const toast = useToast();
  const { setPendingPromptId } = useWorkbenchStore();
  const [copied, setCopied] = useState(false);
  const [forking, setForking] = useState(false);
  const [discussing, setDiscussing] = useState(false);

  const normalizedVariant = variant === "library" ? "greenhouse" : variant === "gallery" ? "commons" : variant;

  const title = prompt.metadata?.title || prompt.name.replace(/\.md$/, "");
  const description =
    prompt.metadata?.description ||
    prompt.rawContent?.split("\n").slice(0, 3).join(" ").slice(0, 150) + "..." ||
    "No description available";
  const tags = prompt.metadata?.tags || [];

  const handleQuickCopy = async () => {
    if (prompt.rawContent) {
      await navigator.clipboard.writeText(prompt.rawContent);
      toast.success("Prompt copied to clipboard");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRunInChat = () => {
    router.push(`/?loadPrompt=${prompt.id}`);
  };

  const handleEdit = () => {
    router.push(`/?loadPrompt=${prompt.id}`);
  };

  const handleFork = async () => {
    if (forking) return;

    setForking(true);
    try {
      const response = await fetch("/api/drive/fork", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sourceFileId: prompt.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Prompt forked to your library: ${data.newFileName}`);
      } else {
        toast.error(data.error || "Failed to fork prompt");
      }
    } catch (error) {
      console.error("Error forking prompt:", error);
      toast.error("Failed to fork prompt");
    } finally {
      setForking(false);
    }
  };

  const handleOpenInWorkbench = () => {
    setPendingPromptId(prompt.id);
    router.push("/workbench");
  };

  const handleDiscussInDojo = async () => {
    if (discussing) return;

    setDiscussing(true);
    try {
      const situation = `Let's discuss this prompt: "${title}"`;
      const perspectives = prompt.rawContent ? [prompt.rawContent] : [];

      const result = await createSessionFromContext({
        artifact_type: 'prompt',
        artifact_id: prompt.id,
        situation,
        perspectives,
        user_id: 'dev-user',
        title: `Discuss: ${title}`,
      });

      toast.success("Dojo session started");
      router.push(`/dojo/${result.session_id}`);
    } catch (error) {
      console.error("Error creating Dojo session:", error);
      toast.error("Failed to start Dojo session");
    } finally {
      setDiscussing(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      transition: { duration: 0.2 },
    },
  };

  const tagVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (index: number) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: index * 0.05, duration: 0.2 },
    }),
  };

  return (
    <motion.div
      className="group bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow duration-200 hover:border-blue-300 dark:hover:border-blue-600 flex flex-col h-full"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {title}
          </h3>
          <button
            onClick={handleQuickCopy}
            className={cn(
              "flex-shrink-0 p-1.5 rounded-md transition-all duration-100",
              "active:scale-95",
              copied
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            )}
            title="Quick Copy"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">{description}</p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag, index) => (
              <motion.button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag);
                }}
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                  onTagClick && "cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-95 transition-all duration-100"
                )}
                variants={tagVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "rgb(219 234 254)",
                }}
                aria-label={`Filter by tag: ${tag}`}
                disabled={!onTagClick}
              >
                {tag}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
        {normalizedVariant === "greenhouse" ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 active:scale-95 transition-all duration-100 text-sm font-medium"
                aria-label={`Edit ${title}`}
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={handleRunInChat}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 transition-all duration-100 text-sm font-medium"
                aria-label={`Run ${title} in chat`}
              >
                <PlayCircle className="h-4 w-4" />
                Run in Chat
              </button>
            </div>
            <button
              onClick={handleOpenInWorkbench}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 active:scale-95 transition-all duration-100 text-sm font-medium"
              aria-label={`Open ${title} in Workbench`}
            >
              <FileEdit className="h-4 w-4" />
              Open in Workbench
            </button>
            <button
              onClick={handleDiscussInDojo}
              disabled={discussing}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded-md hover:bg-orange-700 dark:hover:bg-orange-600 active:scale-95 transition-all duration-100 text-sm font-medium",
                discussing && "opacity-50 cursor-not-allowed"
              )}
              aria-label={`Discuss ${title} in Dojo`}
            >
              <MessageSquare className="h-4 w-4" />
              {discussing ? "Starting..." : "Discuss in Dojo"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleFork}
              disabled={forking}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 active:scale-95 transition-all duration-100 text-sm font-medium",
                forking && "opacity-50 cursor-not-allowed"
              )}
            >
              <Download className="h-4 w-4" />
              {forking ? "Forking..." : "Fork to Greenhouse"}
            </button>
            <button
              onClick={handleOpenInWorkbench}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 active:scale-95 transition-all duration-100 text-sm font-medium"
              aria-label={`Open ${title} in Workbench`}
            >
              <FileEdit className="h-4 w-4" />
              Open in Workbench
            </button>
            <button
              onClick={handleDiscussInDojo}
              disabled={discussing}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded-md hover:bg-orange-700 dark:hover:bg-orange-600 active:scale-95 transition-all duration-100 text-sm font-medium",
                discussing && "opacity-50 cursor-not-allowed"
              )}
              aria-label={`Discuss ${title} in Dojo`}
            >
              <MessageSquare className="h-4 w-4" />
              {discussing ? "Starting..." : "Discuss in Dojo"}
            </button>
          </div>
        )}
        <TrailOfThoughtPanel artifactType="prompt" artifactId={prompt.id} className="mt-2" />
      </div>
    </motion.div>
  );
}
