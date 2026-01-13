export function MultiAgentSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600 text-sm">Loading multi-agent view...</p>
      </div>
    </div>
  );
}
