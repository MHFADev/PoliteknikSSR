"use client";

import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-ink">{label}</label>
      )}
      <input
        className={cn(
          "w-full h-12 px-4 rounded-flip7-lg bg-surface border border-outline text-ink focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-coral">{error}</p>}
    </div>
  );
}