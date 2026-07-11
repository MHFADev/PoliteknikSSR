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
import styles from "@/styles/components/ui/Card.module.css";

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

type CardVariant = "skylearn" | "flip7" | "flip7-highlight" | "flip7-boom";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children?: ReactNode;
}

// Map varian → class CSS module
const CARD_VARIANTS: Record<CardVariant, string> = {
  skylearn:        styles.cardSkylearn,
  flip7:           styles.cardFlip7,
  "flip7-highlight": styles.cardFlip7Highlight,
  "flip7-boom":    styles.cardFlip7Boom,
};

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export function Card({ variant = "skylearn", className, children, ...props }: CardProps) {
  return (
    <div className={cn(styles.card, CARD_VARIANTS[variant], className)} {...props}>
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
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        {icon && <div className={styles.headerIcon}>{icon}</div>}
        <div>
          {title && <h3 className={styles.headerTitle}>{title}</h3>}
          {subtitle && <p className={styles.headerSubtitle}>{subtitle}</p>}
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

export function LessonCard({ title, description, icon, progress, locked, onClick, className }: LessonCardProps) {
  return (
    <div
      onClick={!locked ? onClick : undefined}
      className={cn(
        styles.lessonCard,
        locked && styles.lessonCardLocked,
        className,
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(styles.lessonIcon, locked ? styles.lessonIconLocked : styles.lessonIconActive)}>
          {icon}
        </div>
      </div>
      <h4 className={styles.lessonTitle}>{title}</h4>
      {description && <p className={styles.lessonDesc}>{description}</p>}
      {progress !== undefined && <ProgressBar value={progress} showLabel />}
    </div>
  );
}