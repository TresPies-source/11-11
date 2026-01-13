import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const CostDashboard = dynamic(
  () => import("@/components/cost/CostDashboard").then((mod) => ({ default: mod.CostDashboard })),
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
  title: "Cost Dashboard | 11-11",
  description: "Monitor and manage your AI token usage and costs with three-tier budgeting",
};

export default function CostDashboardPage() {
  return (
    <div className="h-screen overflow-auto bg-background p-6">
      <CostDashboard />
    </div>
  );
}
