"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import styles from "@/styles/components/ui/StarBadge.module.css";

interface StarBadgeProps {
  size?: "sm" | "md" | "lg" | "xl";
  earned?: boolean;
  animated?: boolean;
  color?: "sun" | "gold" | "leaf";
  className?: string;
  children?: React.ReactNode;
}

const sizeClasses: Record<string, string> = {
  sm: styles.starBadgeSm,
  md: styles.starBadgeMd,
  lg: styles.starBadgeLg,
  xl: styles.starBadgeXl,
};

const colorClasses: Record<string, string> = {
  sun: styles.starBadgeSun,
  gold: styles.starBadgeGold,
  leaf: styles.starBadgeLeaf,
};

export function StarBadge({
  size = "md",
  earned = true,
  animated = false,
  color = "sun",
  className,
  children,
}: StarBadgeProps) {
  return (
    <motion.div
      initial={animated ? { scale: 0, rotate: -180 } : {}}
      animate={animated ? { scale: 1, rotate: 0 } : {}}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 0.6,
      }}
      className={cn(
        styles.starBadge,
        sizeClasses[size],
        earned ? colorClasses[color] : styles.starBadgeUnearned,
        className
      )}
    >
      <Star className={styles.starBadgeStar} />
      {children}
    </motion.div>
  );
}

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function StarRating({
  rating,
  maxRating = 3,
  size = "md",
  animated = false,
}: StarRatingProps) {
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  return (
    <div className={styles.starRating}>
      {stars.map((star, index) => (
        <motion.div
          key={star}
          initial={animated ? { y: -20, opacity: 0 } : {}}
          animate={animated ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: index * 0.1, duration: 0.4 }}
        >
          <Star
            className={cn(
              size === "sm" ? "w-5 h-5" : size === "lg" ? "w-8 h-8" : "w-6 h-6",
              index < rating
                ? styles.starRatingStarEarned
                : styles.starRatingStarUnearned
            )}
          />
        </motion.div>
      ))}
    </div>
  );
}
