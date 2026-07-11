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
import styles from "@/styles/components/ui/Badge.module.css";

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

type SkylearnTone = "neutral" | "success" | "warning" | "danger" | "sky" | "sun" | "leaf" | "berry";
type Flip7Tone = "teal" | "gold" | "coral" | "cream";
type Tone = SkylearnTone | Flip7Tone;

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

const FLIP7_TONES = new Set(["teal", "gold", "coral", "cream"]);

const TONE_MAP: Record<Tone, string> = {
  neutral: styles.neutral,
  success: styles.success,
  warning: styles.warning,
  danger:  styles.danger,
  sky:     styles.badgeSky,
  sun:     styles.badgeSun,
  leaf:    styles.leaf,
  berry:   styles.berry,
  teal:    styles.badgeTeal,
  gold:    styles.badgeGold,
  coral:   styles.badgeCoral,
  cream:   styles.cream,
};

const SIZE_MAP: Record<string, string> = {
  sm: styles.badgeSm,
  md: styles.badgeMd,
};

// ---------------------------------------------------------------------------
// Komponen
// ---------------------------------------------------------------------------

export function Badge({ tone = "neutral", children, size = "md", className }: BadgeProps) {
  return (
    <span className={cn(
      styles.badge,
      SIZE_MAP[size],
      styles.pill,
      TONE_MAP[tone],
      className,
    )}>
      {children}
    </span>
  );
}