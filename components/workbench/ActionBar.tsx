"use client";

import { Button } from "@/components/ui/Button";
import { useWorkbenchStore } from "@/lib/stores/workbench.store";

interface ActionBarProps {
  onTest: () => void;
  onSave: () => void;
  onExport: () => void;
}

export function ActionBar({ onTest, onSave, onExport }: ActionBarProps) {
  const { isAgentPanelOpen, toggleAgentPanel } = useWorkbenchStore();

  return (
    <div className="flex items-center gap-2 sm:gap-4 bg-bg-secondary border-t border-bg-tertiary px-3 sm:px-6 py-3 sm:py-4">
      <Button variant="primary" onClick={onTest} className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
        Test
      </Button>
      <Button variant="secondary" onClick={onSave} className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
        Save
      </Button>
      <Button variant="secondary" onClick={onExport} className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
        Export
      </Button>
      <div className="ml-auto">
        <Button variant="secondary" onClick={toggleAgentPanel} className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
          <span className="hidden sm:inline">{isAgentPanelOpen ? "Hide Agent Panel" : "Show Agent Panel"}</span>
          <span className="sm:hidden">{isAgentPanelOpen ? "Hide" : "Show"}</span>
        </Button>
      </div>
    </div>
  );
}
