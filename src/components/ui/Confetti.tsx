"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/ui/Confetti.module.css";

const CONFETTI_COLORS = [
  "#3B82F6", // sky
  "#FBBF24", // sun
  "#22C55E", // leaf
  "#A855F7", // berry
  "#EF4444", // red
  "#2BA8A2", // teal
  "#FFD23F", // gold
  "#EF6C4A", // flip7 coral
];

const CONFETTI_SHAPES = ["circle", "square", "triangle"] as const;
type ConfettiShape = typeof CONFETTI_SHAPES[number];

interface ConfettiPieceProps {
  index: number;
  total: number;
}

function ConfettiPiece({ index, total }: ConfettiPieceProps) {
  const left = Math.random() * 100;
  const size = Math.random() * 10 + 8;
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const shape = CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)];
  const animationIndex = index % 3;
  const animationClass =
    animationIndex === 0 ? "animate-confetti-1" : animationIndex === 1 ? "animate-confetti-2" : "animate-confetti-3";
  const duration = 3 + Math.random() * 2;
  const delay = Math.random() * 0.5;

  const shapeClasses: Record<ConfettiShape, string> = {
    circle: "",
    square: styles.confettiPieceSquare,
    triangle: "clip-triangle",
  };

  return (
    <motion.div
      initial={{ top: -20, opacity: 1 }}
      animate={{
        top: "100vh",
        opacity: 0,
        rotate: Math.random() * 720 - 360,
        x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50],
      }}
      transition={{
        duration: duration,
        delay: delay,
        ease: "easeOut",
      }}
      className={cn(
        styles.confettiPiece,
        shapeClasses[shape]
      )}
      style={{
        left: `${left}%`,
        width: size,
        height: size,
        backgroundColor: color,
      }}
    />
  );
}

interface ConfettiProps {
  active?: boolean;
  count?: number;
  duration?: number;
  onComplete?: () => void;
}

export function Confetti({
  active = true,
  count = 50,
  duration = 5000,
  onComplete,
}: ConfettiProps) {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration, onComplete]);

  if (!visible) return null;

  return (
    <div className={styles.confettiContainer}>
      {Array.from({ length: count }, (_, i) => (
        <ConfettiPiece key={i} index={i} total={count} />
      ))}
    </div>
  );
}
