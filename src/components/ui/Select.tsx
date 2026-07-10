"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useId } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className, ...props }: SelectProps) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={cn(
            "w-full h-12 px-4 pr-10 rounded-flip7-lg bg-surface border border-outline text-ink focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all",
            className
          )}
          {...props}
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted pointer-events-none" />
      </div>
      {error && <p className="text-xs text-coral">{error}</p>}
    </div>
  );
}
