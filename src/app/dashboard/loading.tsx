export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist-soft">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky border-t-transparent" />
        <p className="text-sm text-mist-dim">Memuat...</p>
      </div>
    </div>
  );
}
