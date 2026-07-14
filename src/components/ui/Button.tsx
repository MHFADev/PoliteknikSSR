"use client";

/**
 * Button — Komponen tombol universal
 * ====================================
 * Mendukung 10 varian (Skylearn + Flip7) dan 3 ukuran (sm/md/lg).
 * Semua styling ada di Button.module.css.
 *
 * Cara pakai:
 *   <Button variant="primary" size="md" onClick={handleClick}>
 *     Kirim
 *   </Button>
 *   <Button variant="gold" isLoading>Memuat...</Button>
 */

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import styles from "@/styles/components/ui/Button.module.css";

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

type SkylearnVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Flip7Variant = "gold" | "teal" | "coral" | "boom" | "flip7" | "blue";
type Variant = SkylearnVariant | Flip7Variant;

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  isLoading?: boolean;
  children?: ReactNode;
  size?: "sm" | "md" | "lg";
}

// ---------------------------------------------------------------------------
// Mapping varian → CSS module class
// ---------------------------------------------------------------------------

const FLIP7 = new Set(["gold", "teal", "coral", "boom", "flip7", "blue"]);

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: styles.btnPrimary,
  secondary: styles.btnSecondary,
  outline: styles.btnOutline,
  ghost: styles.btnGhost,
  danger: styles.btnDanger,
  gold: styles.btnGold,
  teal: styles.btnTeal,
  coral: styles.btnCoral,
  boom: styles.btnBoom,
  flip7: styles.btnFlip7,
  blue: styles.btnBlue,
};

const SIZE_CLASSES: Record<string, string> = {
  sm: styles.btnSm,
  md: styles.btnMd,
  lg: styles.btnLg,
};

/** Animasi Skylearn — halus dan ringan */
const SKY_TRANSITION = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
  duration: 0.2,
};

/** Animasi Flip7 — lebih ekspresif dengan bounce */
const F7_TRANSITION = {
  type: "spring" as const,
  stiffness: 300,
  damping: 20,
  duration: 0.2,
  ease: "circOut",
};

// ---------------------------------------------------------------------------
// Komponen
// ---------------------------------------------------------------------------

export function Button({
  variant = "primary",
  isLoading,
  className,
  children,
  disabled,
  size = "md",
  ...props
}: ButtonProps) {
  const isFlip7 = FLIP7.has(variant);

  return (
    <motion.button
      whileHover={!disabled && !isLoading ? { y: -2 } : {}}
      whileTap={!disabled && !isLoading ? { scale: isFlip7 ? 0.95 : 0.97 } : {}}
      transition={isFlip7 ? F7_TRANSITION : SKY_TRANSITION}
      disabled={disabled || isLoading}
      className={cn(
        styles.btn,
        styles.fontSemi,
        SIZE_CLASSES[size],
        isFlip7 ? styles.radiusFlip7 : styles.radiusSkylearn,
        VARIANT_CLASSES[variant],
        isLoading && styles.isLoading,
        className,
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
      {children}
    </motion.button>
  );
}
