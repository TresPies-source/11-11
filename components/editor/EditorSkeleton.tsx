export function EditorSkeleton() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="h-12 border-b border-gray-200 px-4 flex items-center gap-2">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading editor...</p>
        </div>
      </div>
    </div>
  );
}
