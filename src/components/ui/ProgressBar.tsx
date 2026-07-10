"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "sky" | "leaf" | "sun" | "teal" | "gold";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = "leaf",
  showLabel = false,
  size = "md",
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClasses: Record<string, string> = {
    sky: "bg-sky",
    leaf: "bg-leaf",
    sun: "bg-sun",
    teal: "bg-teal",
    gold: "bg-gold",
  };

  const trackClasses: Record<string, string> = {
    sky: "bg-sky-soft",
    leaf: "bg-leaf-soft",
    sun: "bg-sun-soft",
    teal: "bg-teal-bg",
    gold: "bg-gold-light/30",
  };

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-1.5">
        {showLabel && (
          <span className="text-sm font-semibold text-ink-muted">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      <div
        className={cn(
          "w-full rounded-full overflow-hidden",
          sizeClasses[size],
          trackClasses[color]
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", colorClasses[color])}
        />
      </div>
    </div>
  );
}
