import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ContextDashboard = dynamic(
  () => import("@/components/context/ContextDashboard").then((mod) => ({ default: mod.ContextDashboard })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    ),
    ssr: false,
  }
);

export const metadata = {
  title: "Context Dashboard | 11-11",
  description: "Monitor hierarchical context management with 4-tier token optimization",
};

export default function ContextDashboardPage() {
  return (
    <div className="h-screen overflow-auto bg-background p-6">
      <ContextDashboard />
    </div>
  );
}
