/**
 * Badge — Label kecil dengan 12 warna tone
 * ==========================================
 * Mendukung Skylearn (8 tone) dan Flip7 (4 tone) dengan 2 ukuran.
 *
 * Cara pakai:
 *   <Badge tone="success">Aktif</Badge>
 *   <Badge tone="gold" size="sm">Premium</Badge>
 */

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

type SkylearnTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "sky"
  | "leaf"
  | "sun"
  | "berry"
  | "ink";
type Flip7Tone = "teal" | "gold" | "coral" | "cream";
type Tone = SkylearnTone | Flip7Tone;

const skylearnToneClasses: Record<SkylearnTone, string> = {
  neutral: "bg-ink-subtle/10 text-ink-muted",
  success: "bg-leaf-soft text-leaf-deep",
  warning: "bg-sun-soft text-sun-deep",
  danger: "bg-coral-soft text-coral",
  sky: "bg-sky-soft text-sky-deep",
  leaf: "bg-emerald-100 text-emerald-700",
  sun: "bg-amber-100 text-amber-700",
  berry: "bg-purple-100 text-purple-700",
  ink: "bg-ink-muted/10 text-ink-muted",
};

const flip7ToneClasses: Record<Flip7Tone, string> = {
  teal: "bg-teal-bg text-teal-dark",
  gold: "bg-gold-light/30 text-gold-dark",
  coral: "bg-flip7-coral-light/20 text-flip7-coral-dark",
  cream: "bg-flip7-cream text-teal-dark",
};

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}

// ---------------------------------------------------------------------------
// Komponen
// ---------------------------------------------------------------------------

export function Badge({
  tone = "neutral",
  children,
  size = "md",
  className,
}: BadgeProps) {
  const isFlip7Tone = ["teal", "gold", "coral", "cream"].includes(tone);
  const toneClasses = isFlip7Tone
    ? flip7ToneClasses[tone as Flip7Tone]
    : skylearnToneClasses[tone as SkylearnTone];

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const borderRadius = isFlip7Tone
    ? "rounded-flip7-pill"
    : "rounded-skylearn-pill";

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium",
        sizeClasses,
        borderRadius,
        toneClasses,
        className,
      )}
    >
      {children}
    </span>
  );
}
