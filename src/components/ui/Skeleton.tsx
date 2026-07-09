import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-deep/8", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl2 border border-steel/30 bg-mist-soft/80 p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}
