"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?:
    | "deep"
    | "ocean"
    | "steel"
    | "blue"
    | "biru1"
    | "kuning"
    | "hijau"
    | "ungu";
  hint?: string;
}

const accentClasses = {
  deep: "bg-deep/10 text-deep",
  ocean: "bg-ocean/20 text-deep",
  blue: "bg-blue-vibrant/15 text-blue-vibrant",
  steel: "bg-steel/10 text-deep",
  biru1: "bg-[#1D4ED8]/15 text-[#1D4ED8]",
  kuning: "bg-[#FBBF24]/15 text-[#FBBF24]",
  hijau: "bg-[#16A34A]/15 text-[#16A34A]",
  ungu: "bg-[#8B5CF6]/15 text-[#8B5CF6]",
};

export function StatCard({
  label,
  value,
  icon,
  accent = "deep",
  hint,
}: StatCardProps) {
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
      <div
        className={cn(
          "absolute bottom-0 left-0 h-1 w-full opacity-70",
          accentClasses[accent],
        )}
      />
    </Card>
  );
}
