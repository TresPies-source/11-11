"use client";

import { Button } from "@/components/ui/Button";

export function ActionBar() {
  const handleTestWithDojo = () => {
    console.log("[Test with Dojo] button clicked");
  };

  const handleSave = () => {
    console.log("[Save] button clicked");
  };

  const handleExport = () => {
    console.log("[Export] button clicked");
  };

  return (
    <div className="flex items-center gap-4 bg-bg-secondary border-t border-bg-tertiary px-6 py-4">
      <Button variant="primary" onClick={handleTestWithDojo}>
        Test with Dojo
      </Button>
      <Button variant="secondary" onClick={handleSave}>
        Save
      </Button>
      <Button variant="secondary" onClick={handleExport}>
        Export
      </Button>
    </div>
  );
}
