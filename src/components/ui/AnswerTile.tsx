"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import styles from "@/styles/components/ui/AnswerTile.module.css";

type AnswerState = "idle" | "correct" | "incorrect";

interface AnswerTileProps {
  children: React.ReactNode;
  state?: AnswerState;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function AnswerTile({
  children,
  state = "idle",
  selected = false,
  onClick,
  disabled = false,
  className,
}: AnswerTileProps) {
  const stateClasses: Record<AnswerState, string> = {
    idle: styles.answerTileIdle,
    correct: styles.answerTileCorrect,
    incorrect: styles.answerTileIncorrect,
  };

  const iconColorClasses: Record<AnswerState, string> = {
    idle: "",
    correct: styles.answerTileIconCorrect,
    incorrect: styles.answerTileIconIncorrect,
  };

  const Icon = state === "correct" ? Check : state === "incorrect" ? X : null;

  return (
    <motion.button
      whileHover={!disabled ? { y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={cn(
        styles.answerTile,
        stateClasses[state],
        selected && state === "idle" && styles.answerTileSelected,
        disabled && styles.answerTileDisabled,
        className
      )}
      animate={state === "incorrect" ? { x: [-4, 4, -4, 4, 0] } : {}}
      transition={state === "incorrect" ? { duration: 0.4 } : {}}
    >
      <div className={styles.answerTileContent}>
        {typeof children === "string" ? (
          <p className={styles.answerTileText}>{children}</p>
        ) : (
          children
        )}
      </div>
      {Icon && state !== "idle" && (
        <div className={cn(styles.answerTileIcon, iconColorClasses[state])}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </motion.button>
  );
}
