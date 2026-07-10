"use client";

import { cn } from "@/lib/utils"; // Utility untuk merge Tailwind classes
import { motion, HTMLMotionProps } from "framer-motion"; // Animasi halus
import { Loader2 } from "lucide-react"; // Ikon loading spinner
import type { ReactNode } from "react";

// Tipe varian tombol: Skylearn (warna dasar) & Flip7 (warna aksen)
type SkylearnVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Flip7Variant = "gold" | "teal" | "coral" | "boom" | "flip7";
type Variant = SkylearnVariant | Flip7Variant;

// Props komponen Button
interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  isLoading?: boolean;
  children?: ReactNode;
  size?: "sm" | "md" | "lg"; // Ukuran tombol
}

// Kelas untuk varian Skylearn (desain bersih, profesional)
const skylearnVariantClasses: Record<SkylearnVariant, string> = {
  primary: "bg-sky text-white hover:bg-sky-deep shadow-skylearn-sky active:scale-[0.97]", // Warna biru utama
  secondary: "bg-surface text-ink-muted hover:bg-outline border border-outline", // Tombol sekunder
  outline: "border border-outline text-ink-muted hover:bg-surface hover:border-sky hover:text-sky", // Tombol berbatas
  ghost: "text-ink-muted hover:bg-surface hover:text-sky", // Tombol transparan
  danger: "bg-coral text-white hover:opacity-90 shadow-skylearn", // Tombol bahaya (error/hapus)
};

// Kelas untuk varian Flip7 (warna hangat, aksen)
const flip7VariantClasses: Record<Flip7Variant, string> = {
  gold: "bg-gold text-teal-dark hover:bg-gold-light shadow-flip7-gold-glow active:scale-[0.95]",
  teal: "bg-teal text-white hover:bg-teal-light shadow-flip7-teal-glow active:scale-[0.95]",
  coral: "bg-flip7-coral text-white hover:bg-flip7-coral-light shadow-flip7-coral-glow active:scale-[0.95]",
  boom: "bg-flip7-coral text-white animate-flip7-boom-pulse shadow-flip7-coral-glow active:scale-[0.95]",
  flip7: "bg-gradient-to-r from-gold via-gold-light to-gold text-teal-dark hover:from-gold-light hover:to-gold shadow-flip7-gold-glow active:scale-[0.95]",
};

// Kelas untuk ukuran tombol (sesuai Skylearn tap target 56px minimum)
const sizeClasses = {
  sm: "min-h-[40px] px-4 py-2 text-sm", // Ukuran kecil
  md: "min-h-[56px] px-6 py-3 text-lg", // Ukuran standar (rekomendasi)
  lg: "min-h-[72px] px-8 py-4 text-xl", // Ukuran besar
};

// Komponen Button yang reusable dengan animasi
export function Button({
  variant = "primary",
  isLoading,
  className,
  children,
  disabled,
  size = "md",
  ...props
}: ButtonProps) {
  // Deteksi apakah ini varian Flip7 untuk pilih styling yang tepat
  const isFlip7Variant = ["gold", "teal", "coral", "boom", "flip7"].includes(variant);
  const variantClasses = isFlip7Variant
    ? flip7VariantClasses[variant as Flip7Variant]
    : skylearnVariantClasses[variant as SkylearnVariant];

  // Border radius: Skylearn pakai 16px, Flip7 pakai pill (999px)
  const borderRadius = isFlip7Variant ? "rounded-flip7-pill" : "rounded-skylearn-lg";

  return (
    <motion.button
      // Efek hover: naik 2px, bisa di-disable jika disabled/loaded
      whileHover={!disabled && !isLoading ? { y: -2 } : {}}
      // Efek tap: scale sedikit, tergantung varian
      whileTap={!disabled && !isLoading ? (isFlip7Variant ? { scale: 0.95 } : { scale: 0.97 }) : {}}
      // Transition animation
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
      {/* Tampilkan spinner kalau loading */}
      {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
      {children}
    </motion.button>
  );
}