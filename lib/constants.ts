export const AGENT_PERSONAS = [
  {
    id: "manus",
    name: "Manus",
    description: "High-agency reasoning and complex task orchestration",
    color: "blue",
  },
  {
    id: "supervisor",
    name: "Supervisor",
    description: "Multi-agent coordination and workflow management",
    color: "purple",
  },
  {
    id: "librarian",
    name: "The Librarian",
    description: "Semantic search and proactive prompt suggestions",
    color: "green",
  },
  {
    id: "researcher",
    name: "Researcher",
    description: "Deep analysis and knowledge synthesis",
    color: "amber",
  },
] as const;

export const MAX_CHAT_PANELS = 6;

export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 500;
export const SIDEBAR_DEFAULT_WIDTH = 280;
export const SIDEBAR_COLLAPSED_WIDTH = 48;

export const PANEL_TRANSITION_DURATION = 0.2;
export const ANIMATION_EASE = [0.23, 1, 0.32, 1];

export const PLANNING_DIRECTORIES = [
  "00_Roadmap",
  "01_PRDs",
  "02_Specs",
  "03_Prompts",
  "04_System",
  "05_Logs",
] as const;
