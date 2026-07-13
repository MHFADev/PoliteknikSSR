export default function PembimbingLoading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-mist-dim/20" />
        <div className="h-4 w-72 rounded bg-mist-dim/20" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-48 rounded-xl bg-mist-dim/10" />
          <div className="h-48 rounded-xl bg-mist-dim/10" />
        </div>
      </div>
    </div>
  );
}
