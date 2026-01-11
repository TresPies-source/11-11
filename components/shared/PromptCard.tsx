"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Copy, Check, PlayCircle, Download } from "lucide-react";
import { PromptFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

interface PromptCardProps {
  prompt: PromptFile;
  variant: "library" | "gallery";
}

export function PromptCard({ prompt, variant }: PromptCardProps) {
  const router = useRouter();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [forking, setForking] = useState(false);

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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    hover: {
      scale: 1.02,
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
      className="group bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-200 hover:border-blue-300 flex flex-col h-full"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {title}
          </h3>
          <button
            onClick={handleQuickCopy}
            className={cn(
              "flex-shrink-0 p-1.5 rounded-md transition-colors",
              copied
                ? "bg-green-100 text-green-600"
                : "hover:bg-gray-100 text-gray-500"
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

        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{description}</p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag, index) => (
              <motion.span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                variants={tagVariants}
                initial="hidden"
                animate="visible"
                custom={index}
              >
                {tag}
              </motion.span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100">
        {variant === "library" ? (
          <button
            onClick={handleRunInChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <PlayCircle className="h-4 w-4" />
            Run in Chat
          </button>
        ) : (
          <button
            onClick={handleFork}
            disabled={forking}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium",
              forking && "opacity-50 cursor-not-allowed"
            )}
          >
            <Download className="h-4 w-4" />
            {forking ? "Forking..." : "Fork to Library"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
