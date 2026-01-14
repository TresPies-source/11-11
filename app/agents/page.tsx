import { Metadata } from "next";
import { AgentRegistryView } from "@/components/agents/AgentRegistryView";

export const metadata: Metadata = {
  title: "Agent Registry | 11-11",
  description:
    "Explore the 11-11 multi-agent system: Supervisor, Dojo, Librarian, and Debugger agents",
};

export default function AgentsPage() {
  return <AgentRegistryView />;
}
