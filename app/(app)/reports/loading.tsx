export default function ReportsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-20 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
