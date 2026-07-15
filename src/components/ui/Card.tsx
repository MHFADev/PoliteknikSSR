/**
 * Card — Komponen kartu konten dengan 4 varian
 * ==============================================
 * - skylearn: standar putih untuk tampilan profesional
 * - flip7: aksen teal dengan bayangan kartu
 * - flip7-highlight: aksen gold untuk highlight
 * - flip7-boom: aksen coral dengan animasi pulse
 *
 * Juga mengekspor CardHeader dan LessonCard.
 *
 * Cara pakai:
 *   <Card variant="flip7">
 *     <CardHeader title="Judul" icon={<Icon />} action={<Button>Edit</Button>} />
 *     <p>Konten kartu</p>
 *   </Card>
 */

import { cn } from "@/lib/utils";
import { type HTMLAttributes, type ReactNode } from "react";
import { ProgressBar } from "./ProgressBar";
// 🔥 Import CSS Module biar background pake var(--bg-card) — ngikut mode gelap!
import styles from "@/styles/components/ui/Card.module.css";

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

type CardVariant = "skylearn" | "flip7" | "flip7-highlight" | "flip7-boom";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children?: ReactNode;
}

// ---------------------------------------------------------------------------
// Variant Classes
// ---------------------------------------------------------------------------

/* 🔥 Card variants — pake CSS variables & bg-card biar ngikut mode gelap */
/* Background diatur via CSS Module (.cardSkylearn dkk) yang pake var(--bg-card) */
const variantClasses: Record<CardVariant, string> = {
  skylearn: "rounded-skylearn-xl border border-outline shadow-skylearn",
  flip7: "rounded-flip7-lg shadow-flip7-card border-l-4 border-[#3A5BF0]",
  "flip7-highlight":
    "rounded-flip7-lg shadow-flip7-gold-glow border-l-4 border-gold",
  "flip7-boom":
    "rounded-flip7-lg border-l-4 border-flip7-coral animate-flip7-boom-pulse",
};

/* Mapping variant → CSS Module class untuk background */
const variantBgClass: Record<CardVariant, string> = {
  skylearn: styles.cardSkylearn,
  flip7: styles.cardFlip7,
  "flip7-highlight": styles.cardFlip7Highlight,
  "flip7-boom": styles.cardFlip7Boom,
};

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export function Card({
  variant = "skylearn",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "p-5 sm:p-6",
        variantBgClass[variant],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CardHeader
// ---------------------------------------------------------------------------

interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function CardHeader({ title, subtitle, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-3">
        {icon && <div className="shrink-0 text-sky">{icon}</div>}
        <div>
          {title && (
            <h3 className="font-display text-lg font-semibold text-ink">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-ink-subtle mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LessonCard
// ---------------------------------------------------------------------------

interface LessonCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  progress?: number;
  locked?: boolean;
  onClick?: () => void;
  className?: string;
}

export function LessonCard({
  title,
  description,
  icon,
  progress,
  locked,
  onClick,
  className,
}: LessonCardProps) {
  return (
    <div
      onClick={!locked ? onClick : undefined}
      className={cn(
        "rounded-skylearn-xl border border-outline p-5 transition-all cursor-pointer",
        !locked &&
          "hover:shadow-skylearn-sky hover:border-sky hover:-translate-y-1",
        locked && "opacity-60 cursor-not-allowed",
        styles.lessonCard /* 🔥 bg dari CSS Module biar ngikut dark mode */,
        className,
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-16 h-16 rounded-skylearn-lg flex items-center justify-center text-3xl",
            locked ? "text-sun" : "text-sky",
          )}
        >
          {icon}
        </div>
      </div>
      <h4 className="font-display text-lg font-semibold text-ink mb-1">
        {title}
      </h4>
      {description && (
        <p className="text-sm text-ink-subtle mb-3">{description}</p>
      )}
      {progress !== undefined && <ProgressBar value={progress} showLabel />}
    </div>
  );
}
