export function LibrarianSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-bg-primary">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-librarian border-t-transparent rounded-full mx-auto mb-4" aria-label="Loading spinner" />
        <p className="text-text-secondary text-sm">Loading Librarian...</p>
      </div>
    </div>
  );
}
