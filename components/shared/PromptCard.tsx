"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, PlayCircle, Download } from "lucide-react";
import { PromptFile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PromptCardProps {
  prompt: PromptFile;
  variant: "library" | "gallery";
}

export function PromptCard({ prompt, variant }: PromptCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const title = prompt.metadata?.title || prompt.name.replace(/\.md$/, "");
  const description =
    prompt.metadata?.description ||
    prompt.rawContent?.split("\n").slice(0, 3).join(" ").slice(0, 150) + "..." ||
    "No description available";
  const tags = prompt.metadata?.tags || [];

  const handleQuickCopy = async () => {
    if (prompt.rawContent) {
      await navigator.clipboard.writeText(prompt.rawContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRunInChat = () => {
    router.push(`/?loadPrompt=${prompt.id}`);
  };

  const handleFork = () => {
    alert("Fork functionality will be implemented in a future sprint. This will copy the prompt to your library.");
  };

  return (
    <div className="group bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 hover:border-blue-300 flex flex-col h-full">
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
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
              >
                {tag}
              </span>
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            Fork to Library
          </button>
        )}
      </div>
    </div>
  );
}
