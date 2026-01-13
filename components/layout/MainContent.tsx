"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActiveTab } from "@/lib/types";
import { PANEL_TRANSITION_DURATION, ANIMATION_EASE } from "@/lib/constants";
import { EditorView } from "@/components/editor/EditorView";
import { MultiAgentView } from "@/components/multi-agent/MultiAgentView";

export function MainContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("multi-agent");

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="h-14 border-b border-border flex items-center px-6 gap-1">
        <TabButton
          icon={FileText}
          label="Editor"
          active={activeTab === "editor"}
          onClick={() => setActiveTab("editor")}
        />
        <TabButton
          icon={Users}
          label="Multi-Agent"
          active={activeTab === "multi-agent"}
          onClick={() => setActiveTab("multi-agent")}
        />
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === "editor" ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: PANEL_TRANSITION_DURATION, ease: ANIMATION_EASE }}
              className="absolute inset-0"
            >
              <EditorView />
            </motion.div>
          ) : (
            <motion.div
              key="multi-agent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: PANEL_TRANSITION_DURATION, ease: ANIMATION_EASE }}
              className="absolute inset-0"
            >
              <MultiAgentView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface TabButtonProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ icon: Icon, label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200",
        "hover:bg-accent",
        active
          ? "text-primary font-medium"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
      {active && (
        <motion.div
          layoutId="active-tab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          transition={{ duration: PANEL_TRANSITION_DURATION, ease: ANIMATION_EASE }}
        />
      )}
    </button>
  );
}
