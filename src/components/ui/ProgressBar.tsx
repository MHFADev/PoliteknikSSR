"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import styles from "@/styles/components/ui/ProgressBar.module.css";

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

  const fillClasses: Record<string, string> = {
    sky: styles.progressFillSky,
    leaf: styles.progressFillLeaf,
    sun: styles.progressFillSun,
    teal: styles.progressFillTeal,
    gold: styles.progressFillGold,
  };

  const trackColorClasses: Record<string, string> = {
    sky: styles.progressTrackSky,
    leaf: styles.progressTrackLeaf,
    sun: styles.progressTrackSun,
    teal: styles.progressTrackTeal,
    gold: styles.progressTrackGold,
  };

  const sizeClasses: Record<string, string> = {
    sm: styles.progressTrackSm,
    md: styles.progressTrackMd,
    lg: styles.progressTrackLg,
  };

  return (
    <div className={cn(styles.progressWrapper, className)}>
      <div className={styles.progressHeader}>
        {showLabel && (
          <span className={styles.progressLabel}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      <div
        className={cn(
          styles.progressTrack,
          sizeClasses[size],
          trackColorClasses[color]
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(styles.progressFill, fillClasses[color])}
        />
      </div>
    </div>
  );
}
