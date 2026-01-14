import dynamic from "next/dynamic";
import { Metadata } from "next";
import { Leaf } from "lucide-react";

const SeedsView = dynamic(
  () => import("@/components/seeds/seeds-view").then((mod) => ({ default: mod.SeedsView })),
  {
    loading: () => (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Leaf className="h-8 w-8 text-green-600 dark:text-green-500" />
            🌱 Seed Library
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your knowledge seeds through Keep, Grow, Compost, and Replant
          </p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-full max-w-md"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export const metadata: Metadata = {
  title: "Seed Library | Knowledge Garden",
  description:
    "Manage your knowledge seeds through the Dojo Protocol's Memory Garden pattern: Keep, Grow, Compost, and Replant",
};

export default function SeedsPage() {
  return <SeedsView />;
}
