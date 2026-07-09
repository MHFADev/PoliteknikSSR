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
  primary: "bg-blue-vibrant text-mist hover:bg-blue-dark",
  secondary: "bg-steel text-deep hover:bg-steel-dark",
  outline: "border border-blue/15 text-blue hover:bg-blue/5",
  ghost: "text-steel hover:bg-deep/5",
  danger: "bg-danger text-mist hover:opacity-90",
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
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium",
        "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  );
}
