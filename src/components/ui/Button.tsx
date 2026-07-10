"use client";

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  isLoading?: boolean;
  children?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-sky text-white hover:bg-sky-deep shadow-skylearn",
  secondary: "bg-surface text-ink-muted hover:bg-outline border border-outline",
  outline: "border border-outline text-ink-muted hover:bg-surface",
  ghost: "text-ink-muted hover:bg-surface",
  danger: "bg-coral text-white hover:opacity-90",
};

export function Button({
  variant = "primary",
  isLoading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 min-h-[56px] rounded-skylearn-lg px-6 py-3 text-lg font-semibold",
        "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
      {children}
    </motion.button>
  );
}
