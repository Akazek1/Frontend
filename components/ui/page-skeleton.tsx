"use client";

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="px-4 pt-5 space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="h-6 w-36 bg-gray-200 rounded-xl" />
        <div className="h-8 w-8 bg-gray-200 rounded-full" />
      </div>

      {/* Cards */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 space-y-3 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
              <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded-lg w-full" />
          <div className="h-3 bg-gray-100 rounded-lg w-5/6" />
        </div>
      ))}
    </div>
  );
}
