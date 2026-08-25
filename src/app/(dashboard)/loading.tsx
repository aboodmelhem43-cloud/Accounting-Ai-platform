export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
        </div>
        <div className="h-9 w-36 bg-gray-100 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-5 bg-gray-50">
            <div className="h-6 w-6 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-6 w-20 bg-gray-300 rounded" />
            <div className="h-3 w-16 bg-gray-100 rounded mt-2" />
          </div>
        ))}
      </div>

      <div className="card">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="flex gap-3 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-28 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card h-64" />
        <div className="card h-64" />
      </div>
    </div>
  );
}
