"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import styles from "@/styles/components/dashboard/StatCard.module.css";

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
    | "ungu"
    | "sky"
    | "sun"
    | "leaf"
    | "coral"
    | "berry"
    | "teal"
    | "gold";
  hint?: string;
}

const accentClasses: Record<string, string> = {
  deep: "bg-deep/10 text-deep",
  ocean: "bg-ocean/20 text-deep",
  blue: "bg-blue-vibrant20 text-blue-vibrant",
  steel: "bg-steel/10 text-deep",
  biru1: "bg-[#1D4ED8]20 text-[#1D4ED8]",
  kuning: "bg-[#FBBF24]20 text-[#FBBF24]",
  hijau: "bg-[#16A34A]20 text-[#16A34A]",
  ungu: "bg-[#8B5CF6]20 text-[#8B5CF6]",
  sky: "bg-[#0EA5E9]20 text-[#0EA5E9]",
  sun: "bg-[#F59E0B]20 text-[#F59E0B]",
  leaf: "bg-[#22C55E]20 text-[#22C55E]",
  coral: "bg-[#EF4444]20 text-[#EF4444]",
  berry: "bg-[#EC4899]20 text-[#EC4899]",
  teal: "bg-[#14B8A6]20 text-[#14B8A6]",
  gold: "bg-[#D4AF37]20 text-[#D4AF37]",
};
const accentMap: Record<string, string> = {
  ocean: styles.statCardOcean,
  sky: styles.statCardSky,
  sun: styles.statCardSun,
  leaf: styles.statCardLeaf,
  coral: styles.statCardCoral,
  berry: styles.statCardBerry,
  teal: styles.statCardTeal,
  gold: styles.statCardGold,
};

export function StatCard({
  label,
  value,
  icon,
  accent = "deep",
  hint,
}: StatCardProps) {
  return (
    <Card className={cn(styles.statCard, accentMap[accent])}>
      <div className={styles.statCardContent}>
        <div>
          <p className={styles.statCardLabel}>{label}</p>
          <motion.p
            key={String(value)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.statCardValue}
          >
            {value}
          </motion.p>
          {hint && <p className={styles.statCardHint}>{hint}</p>}
        </div>
        <div className={styles.statCardIcon}>{icon}</div>
      </div>
      {/* garis aksen tipis di bawah */}
      <div
        className={cn(
          "absolute bottom-0 left-0 h-1 w-full opacity-70",
          accentClasses[accent],
        )}
      />
      <div className={styles.statCardAccent} />
    </Card>
  );
}
