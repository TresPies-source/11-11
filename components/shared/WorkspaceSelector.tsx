"use client";

import { useState } from "react";
import { ChevronDown, FolderOpen } from "lucide-react";
import { Workspace } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WorkspaceSelectorProps {
  workspaces?: Workspace[];
  currentWorkspace?: Workspace;
  onWorkspaceChange?: (workspace: Workspace) => void;
}

export function WorkspaceSelector({
  workspaces,
  currentWorkspace,
  onWorkspaceChange,
}: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const mockWorkspaces: Workspace[] = workspaces ?? [
    {
      id: "ws-001",
      name: "Personal Workspace",
      type: "personal",
      googleDriveId: "mock-drive-id",
      githubRepo: "11-11/personal",
    },
    {
      id: "ws-002",
      name: "Team Workspace",
      type: "team",
      googleDriveId: "mock-team-drive-id",
      githubRepo: "11-11/team",
    },
  ];

  const current = currentWorkspace ?? mockWorkspaces[0];

  const handleSelect = (workspace: Workspace) => {
    setIsOpen(false);
    onWorkspaceChange?.(workspace);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
      >
        <FolderOpen className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          {current.name}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {mockWorkspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSelect(workspace)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                    workspace.id === current.id && "bg-blue-50"
                  )}
                >
                  <FolderOpen
                    className={cn(
                      "h-4 w-4",
                      workspace.id === current.id
                        ? "text-blue-600"
                        : "text-gray-500"
                    )}
                  />
                  <div className="flex-1 text-left">
                    <div
                      className={cn(
                        "font-medium",
                        workspace.id === current.id
                          ? "text-blue-700"
                          : "text-gray-700"
                      )}
                    >
                      {workspace.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {workspace.type}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
