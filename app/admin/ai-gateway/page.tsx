import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const GatewayDashboard = dynamic(
  () => import("@/components/ai-gateway/GatewayDashboard").then((mod) => ({ default: mod.GatewayDashboard })),
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
  title: "AI Gateway Dashboard | 11-11",
  description: "Monitor AI provider routing, performance, and request analytics",
};

export default function AIGatewayDashboardPage() {
  return (
    <div className="h-screen overflow-auto bg-background p-6">
      <GatewayDashboard />
    </div>
  );
}
