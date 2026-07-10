"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface StarBadgeProps {
  size?: "sm" | "md" | "lg" | "xl";
  earned?: boolean;
  animated?: boolean;
  color?: "sun" | "gold" | "leaf";
  className?: string;
  children?: React.ReactNode;
}

const sizeClasses = {
  sm: "w-8 h-8 text-lg",
  md: "w-12 h-12 text-2xl",
  lg: "w-16 h-16 text-3xl",
  xl: "w-20 h-20 text-4xl",
};

const colorClasses = {
  sun: "bg-sun text-white",
  gold: "bg-gold text-teal-dark",
  leaf: "bg-leaf text-white",
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
        "relative flex items-center justify-center rounded-full",
        sizeClasses[size],
        earned ? colorClasses[color] : "bg-outline text-ink-subtle",
        earned && animated && "shadow-skylearn-sun",
        className
      )}
    >
      <Star className="w-1/2 h-1/2 fill-current" />
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
    <div className="flex items-center gap-2">
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
                ? "fill-sun text-sun drop-shadow-sm"
                : "text-outline"
            )}
          />
        </motion.div>
      ))}
    </div>
  );
}
