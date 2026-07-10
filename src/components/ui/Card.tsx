import { cn } from "@/lib/utils";
import { HTMLAttributes, ReactNode } from "react";
import { ProgressBar } from "./ProgressBar";

type CardStyle = "skylearn" | "flip7" | "flip7-highlight" | "flip7-boom";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  style?: CardStyle;
  children?: ReactNode;
}

export function Card({ style = "skylearn", className, children, ...props }: CardProps) {
  const styleClasses: Record<CardStyle, string> = {
    skylearn: "bg-white rounded-skylearn-xl border border-outline shadow-skylearn",
    flip7: "bg-white rounded-flip7-lg shadow-flip7-card border-l-4 border-teal-light",
    "flip7-highlight": "bg-gradient-to-r from-gold-light/10 to-white rounded-flip7-lg shadow-flip7-gold-glow border-l-4 border-gold",
    "flip7-boom": "bg-gradient-to-r from-flip7-coral-light/10 to-white rounded-flip7-lg border-l-4 border-flip7-coral animate-flip7-boom-pulse",
  };

  return (
    <div
      className={cn(
        "p-5 sm:p-6",
        styleClasses[style],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

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
        {icon && (
          <div className="shrink-0 text-sky">
            {icon}
          </div>
        )}
        <div>
          {title && (
            <h3 className="font-display text-lg font-semibold text-ink">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-ink-subtle mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

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
        "bg-white rounded-skylearn-xl border border-outline p-5 transition-all cursor-pointer",
        !locked && "hover:shadow-skylearn-sky hover:border-sky hover:-translate-y-1",
        locked && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "w-16 h-16 rounded-skylearn-lg flex items-center justify-center text-3xl",
          locked ? "bg-sun-soft text-sun" : "bg-sky-soft text-sky"
        )}>
          {icon}
        </div>
      </div>
      <h4 className="font-display text-lg font-semibold text-ink mb-1">
        {title}
      </h4>
      {description && (
        <p className="text-sm text-ink-subtle mb-3">
          {description}
        </p>
      )}
      {progress !== undefined && (
        <ProgressBar value={progress} showLabel />
      )}
    </div>
  );
}
