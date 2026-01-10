"use client";

import { FileText } from "lucide-react";

export function EditorView() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium">Markdown Editor</p>
        <p className="text-sm mt-2">Coming soon...</p>
      </div>
    </div>
  );
}
