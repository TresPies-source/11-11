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
    <div className="flex items-center gap-4 bg-bg-secondary border-t border-bg-tertiary px-6 py-4">
      <Button variant="primary" onClick={onTest}>
        Test
      </Button>
      <Button variant="secondary" onClick={onSave}>
        Save
      </Button>
      <Button variant="secondary" onClick={onExport}>
        Export
      </Button>
      <div className="ml-auto">
        <Button variant="secondary" onClick={toggleAgentPanel}>
          {isAgentPanelOpen ? "Hide Agent Panel" : "Show Agent Panel"}
        </Button>
      </div>
    </div>
  );
}
