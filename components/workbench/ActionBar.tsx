"use client";

import { Button } from "@/components/ui/Button";
import { Loader2, Database, MessageCircle } from "lucide-react";

interface ActionBarProps {
  onRun: () => void;
  onSave: () => void;
  onExport: () => void;
  onSaveToHub: () => void;
  onDiscussWithDojo: () => void;
  isRunning: boolean;
  hasActiveTab: boolean;
}

export function ActionBar({ onRun, onSave, onExport, onSaveToHub, onDiscussWithDojo, isRunning, hasActiveTab }: ActionBarProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-4 bg-bg-secondary border-t border-bg-tertiary px-3 sm:px-6 py-3 sm:py-4">
      <Button 
        variant="primary" 
        onClick={onRun} 
        disabled={isRunning}
        className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
      >
        {isRunning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isRunning ? 'Running...' : 'Run with Dojo'}
      </Button>
      <Button 
        variant="secondary" 
        onClick={onSave} 
        disabled={isRunning}
        className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
      >
        Save
      </Button>
      <Button 
        variant="secondary" 
        onClick={onSaveToHub} 
        disabled={!hasActiveTab}
        className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
      >
        <Database className="w-4 h-4 mr-1.5" />
        Save to Hub
      </Button>
      <Button 
        variant="secondary" 
        onClick={onDiscussWithDojo} 
        disabled={!hasActiveTab}
        className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
      >
        <MessageCircle className="w-4 h-4 mr-1.5" />
        Discuss with Dojo
      </Button>
      <Button 
        variant="secondary" 
        onClick={onExport} 
        disabled={isRunning}
        className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
      >
        Export
      </Button>
    </div>
  );
}
