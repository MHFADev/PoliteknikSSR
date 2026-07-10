"use client";

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

type SkylearnVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Flip7Variant = "gold" | "teal" | "coral" | "boom" | "flip7";
type Variant = SkylearnVariant | Flip7Variant;

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  isLoading?: boolean;
  children?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const skylearnVariantClasses: Record<SkylearnVariant, string> = {
  primary:
    "bg-sky text-white hover:bg-sky-deep shadow-skylearn-sky active:scale-[0.97]",
  secondary: "bg-surface text-ink-muted hover:bg-outline border border-outline",
  outline: "border border-outline text-ink-muted hover:bg-surface hover:border-sky hover:text-sky",
  ghost: "text-ink-muted hover:bg-surface hover:text-sky",
  danger: "bg-coral text-white hover:opacity-90 shadow-skylearn",
};

const flip7VariantClasses: Record<Flip7Variant, string> = {
  gold: "bg-gold text-teal-dark hover:bg-gold-light shadow-flip7-gold-glow active:scale-[0.95]",
  teal: "bg-teal text-white hover:bg-teal-light shadow-flip7-teal-glow active:scale-[0.95]",
  coral: "bg-flip7-coral text-white hover:bg-flip7-coral-light shadow-flip7-coral-glow active:scale-[0.95]",
  boom: "bg-flip7-coral text-white animate-flip7-boom-pulse shadow-flip7-coral-glow active:scale-[0.95]",
  flip7: "bg-gradient-to-r from-gold via-gold-light to-gold text-teal-dark hover:from-gold-light hover:to-gold shadow-flip7-gold-glow active:scale-[0.95]",
};

const sizeClasses = {
  sm: "min-h-[40px] px-4 py-2 text-sm",
  md: "min-h-[56px] px-6 py-3 text-lg",
  lg: "min-h-[72px] px-8 py-4 text-xl",
};

export function Button({
  variant = "primary",
  isLoading,
  className,
  children,
  disabled,
  size = "md",
  ...props
}: ButtonProps) {
  const isFlip7Variant = ["gold", "teal", "coral", "boom", "flip7"].includes(variant);
  const variantClasses = isFlip7Variant
    ? flip7VariantClasses[variant as Flip7Variant]
    : skylearnVariantClasses[variant as SkylearnVariant];

  const borderRadius = isFlip7Variant ? "rounded-flip7-pill" : "rounded-skylearn-lg";

  return (
    <motion.button
      whileHover={!disabled && !isLoading ? { y: -2 } : {}}
      whileTap={!disabled && !isLoading ? (isFlip7Variant ? { scale: 0.95 } : { scale: 0.97 }) : {}}
      transition={
        isFlip7Variant
          ? { duration: 0.2, ease: "circOut", type: "spring", stiffness: 300, damping: 20 }
          : { duration: 0.2, ease: "easeOut", type: "spring", stiffness: 400, damping: 25 }
      }
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        borderRadius,
        variantClasses,
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
      {children}
    </motion.button>
  );
}
