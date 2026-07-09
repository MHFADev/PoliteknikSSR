"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: "deep" | "ocean" | "steel" | "blue";
  hint?: string;
}

const accentClasses = {
  deep: "bg-deep/10 text-deep",
  ocean: "bg-ocean/20 text-deep",
  blue: "bg-blue-vibrant/15 text-blue-vibrant",
  steel: "bg-steel/10 text-deep",
};

export function StatCard({ label, value, icon, accent = "deep", hint }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-steel">{label}</p>
          <motion.p
            key={String(value)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl font-semibold text-deep mt-1"
          >
            {value}
          </motion.p>
          {hint && <p className="text-xs text-mist-dim mt-1">{hint}</p>}
        </div>
        <div className={cn("rounded-xl p-2.5", accentClasses[accent])}>
          {icon}
        </div>
      </div>
      {/* garis aksen tipis di bawah — signature kecil yang konsisten di semua stat card */}
      <div className={cn("absolute bottom-0 left-0 h-1 w-full opacity-70", accentClasses[accent])} />
    </Card>
  );
}
