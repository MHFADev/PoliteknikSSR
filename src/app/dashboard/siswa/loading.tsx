export default function SiswaLoading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-mist-dim/20" />
        <div className="h-4 w-72 rounded bg-mist-dim/20" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-mist-dim/10" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-mist-dim/10" />
      </div>
    </div>
  );
}
