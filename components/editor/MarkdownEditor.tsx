"use client";

import { useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useRepository } from "@/hooks/useRepository";
import { useDebounce } from "@/hooks/useDebounce";

export function MarkdownEditor() {
  const { fileContent, setFileContent, saveFile, activeFile } = useRepository();
  const debouncedContent = useDebounce(fileContent, 500);

  useEffect(() => {
    if (debouncedContent && activeFile) {
      saveFile();
    }
  }, [debouncedContent, activeFile, saveFile]);

  const handleEditorChange = (value: string | undefined) => {
    setFileContent(value || "");
  };

  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a file to edit
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      language="markdown"
      theme="vs-light"
      value={fileContent}
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
