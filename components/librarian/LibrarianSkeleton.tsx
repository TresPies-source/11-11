import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function LibrarianSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-bg-primary">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4 text-librarian" aria-label="Loading spinner" />
        <p className="text-text-secondary text-sm">Loading Librarian...</p>
      </div>
    </div>
  );
}
