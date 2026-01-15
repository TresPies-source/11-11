import { Skeleton } from "@/components/ui/Skeleton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function EditorSkeleton() {
  return (
    <div className="w-full h-full flex flex-col bg-bg-primary">
      <div className="h-12 border-b border-bg-tertiary px-4 flex items-center gap-2">
        <Skeleton variant="text" width={128} height={16} />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Loading editor...</p>
        </div>
      </div>
    </div>
  );
}
