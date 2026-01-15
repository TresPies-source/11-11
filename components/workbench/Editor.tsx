'use client';

import { Editor as MonacoEditor } from '@monaco-editor/react';
import { useWorkbenchStore } from '@/lib/stores/workbench.store';
import type { editor } from 'monaco-editor';

export function Editor() {
  const { tabs, activeTabId, updateTabContent, isRunning, activeTabError, setActiveTabError } = useWorkbenchStore();
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const handleEditorMount = (editor: editor.IStandaloneCodeEditor, monaco: any) => {
    monaco.editor.defineTheme('dojo-genesis', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'ffffff', background: '0a1e2e' },
        { token: 'comment', foreground: '6b7f91', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'f5a623' },
        { token: 'string', foreground: '4ade80' },
        { token: 'number', foreground: 'ffd699' },
        { token: 'operator', foreground: 'f39c5a' },
      ],
      colors: {
        'editor.background': '#0a1e2e',
        'editor.foreground': '#ffffff',
        'editorCursor.foreground': '#f5a623',
        'editor.lineHighlightBackground': '#0f2838',
        'editorLineNumber.foreground': '#8a9dad',
        'editorLineNumber.activeForeground': '#f5a623',
        'editor.selectionBackground': '#2a4d6380',
        'editor.inactiveSelectionBackground': '#2a4d6340',
        'editorIndentGuide.background': '#1a3a4f',
        'editorIndentGuide.activeBackground': '#2a4d63',
        'editorWidget.background': '#0f2838',
        'editorWidget.border': '#1a3a4f',
        'editorSuggestWidget.background': '#0f2838',
        'editorSuggestWidget.border': '#1a3a4f',
        'editorSuggestWidget.selectedBackground': '#2a4d63',
        'editorHoverWidget.background': '#0f2838',
        'editorHoverWidget.border': '#1a3a4f',
        'scrollbar.shadow': '#0a1e2e',
        'scrollbarSlider.background': '#2a4d6360',
        'scrollbarSlider.hoverBackground': '#2a4d6380',
        'scrollbarSlider.activeBackground': '#2a4d63a0',
      },
    });
    monaco.editor.setTheme('dojo-genesis');
  };

  if (!activeTab) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-primary text-text-tertiary">
        <p>No active tab. Create a new prompt to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {activeTabError && (
        <div className="bg-error/10 border-b border-error/25 text-error px-4 py-3 flex items-center justify-between">
          <span className="text-sm">{activeTabError}</span>
          <button
            onClick={() => setActiveTabError(null)}
            className="ml-4 hover:opacity-70 transition-opacity"
            aria-label="Dismiss error"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
      <MonacoEditor
        height="100%"
        language="markdown"
        value={activeTab.content}
        onChange={(value) => {
          if (value !== undefined && !isRunning) {
            updateTabContent(activeTab.id, value);
          }
        }}
        onMount={handleEditorMount}
        theme="dojo-genesis"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          lineNumbers: 'on',
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding: { top: 16, bottom: 16 },
          readOnly: isRunning,
        }}
      />
    </div>
  );
}
