export default function Loading() {
  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-deep/10" />
      <div className="h-4 w-72 animate-pulse rounded bg-deep/5" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl2 bg-deep/5" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl2 bg-deep/5" />
    </div>
  );
}
