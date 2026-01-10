"use client";

import { MarkdownEditor } from "./MarkdownEditor";
import { useRepository } from "@/hooks/useRepository";

export function EditorView() {
  const { activeFile, isDirty } = useRepository();

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="h-12 border-b border-gray-200 px-4 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          {activeFile?.name || "No file selected"}
        </span>
        {isDirty && (
          <div className="w-2 h-2 rounded-full bg-orange-500" title="Unsaved changes" />
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor />
      </div>
    </div>
  );
}
