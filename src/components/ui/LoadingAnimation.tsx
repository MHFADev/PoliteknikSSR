"use client";

export function LoadingAnimation({ text = "Memuat..." }: { text?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-sky/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-r-sky-deep animate-spin animation-delay-150" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-mist-dim">{text}</span>
          <span className="flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-mist-dim animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-1 w-1 rounded-full bg-mist-dim animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-1 w-1 rounded-full bg-mist-dim animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </div>
      </div>
    </div>
  );
}
