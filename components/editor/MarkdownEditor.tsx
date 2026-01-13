"use client";

import { useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useRepository } from "@/hooks/useRepository";
import { useDebounce } from "@/hooks/useDebounce";
import { useTheme } from "@/hooks/useTheme";

export function MarkdownEditor() {
  const { activeTab, updateTabContent, saveTab } = useRepository();
  const debouncedContent = useDebounce(activeTab?.content || "", 500);
  const { theme } = useTheme();

  useEffect(() => {
    if (activeTab && debouncedContent !== undefined) {
      const savedContent = activeTab.content;
      if (debouncedContent !== savedContent) {
        saveTab(activeTab.id);
      }
    }
  }, [debouncedContent, activeTab, saveTab]);

  const handleEditorChange = (value: string | undefined) => {
    if (activeTab) {
      updateTabContent(activeTab.id, value || "");
    }
  };

  if (!activeTab) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a file to edit
      </div>
    );
  }

  return (
    <Editor
      key={activeTab.id}
      height="100%"
      language="markdown"
      theme={theme === "dark" ? "vs-dark" : "vs"}
      value={activeTab.content}
      onChange={handleEditorChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: "on",
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  );
}
