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
  accent?: "sky" | "sun" | "leaf" | "coral" | "berry" | "teal" | "gold";
  hint?: string;
}

const accentMap: Record<string, string> = {
  sky: styles.statCardSky,
  sun: styles.statCardSun,
  leaf: styles.statCardLeaf,
  coral: styles.statCardCoral,
  berry: styles.statCardBerry,
  teal: styles.statCardTeal,
  gold: styles.statCardGold,
};

export function StatCard({ label, value, icon, accent = "sky", hint }: StatCardProps) {
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
        <div className={styles.statCardIcon}>
          {icon}
        </div>
      </div>
      <div className={styles.statCardAccent} />
    </Card>
  );
}
