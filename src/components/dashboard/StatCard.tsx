"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: "sky" | "sun" | "leaf" | "coral" | "berry" | "teal" | "gold";
  hint?: string;
}

const accentClasses: Record<string, string> = {
  sky: "bg-sky-soft text-sky-deep",
  sun: "bg-sun-soft text-sun-deep",
  leaf: "bg-leaf-soft text-leaf-deep",
  coral: "bg-coral-soft text-coral",
  berry: "bg-berry/10 text-berry",
  teal: "bg-teal-bg text-teal-dark",
  gold: "bg-gold-light/30 text-gold-dark",
};

export function StatCard({ label, value, icon, accent = "sky", hint }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <motion.p
            key={String(value)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl font-semibold text-ink mt-1"
          >
            {value}
          </motion.p>
          {hint && <p className="text-xs text-ink-subtle mt-1">{hint}</p>}
        </div>
        <div className={cn("rounded-skylearn-lg p-3", accentClasses[accent])}>
          {icon}
        </div>
      </div>
      {/* garis aksen tipis di bawah */}
      <div className={cn("absolute bottom-0 left-0 h-1 w-full opacity-70", accentClasses[accent])} />
    </Card>
  );
}
