import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl2 border border-steel/30 bg-mist-soft/80 backdrop-blur-md shadow-glass",
        "p-5 sm:p-6",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="font-display text-lg font-semibold text-deep">{title}</h3>
        {subtitle && <p className="text-sm text-steel mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
