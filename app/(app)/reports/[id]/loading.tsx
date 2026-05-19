export default function ReportDetailLoading() {
  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
      <div className="card p-3 space-y-3">
        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
