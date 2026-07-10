"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

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
    idle: "bg-surface border-outline hover:border-sky hover:shadow-skylearn-sky",
    correct: "bg-leaf-soft border-leaf shadow-skylearn",
    incorrect: "bg-coral-soft border-coral",
  };

  const iconColors: Record<AnswerState, string> = {
    idle: "",
    correct: "text-leaf",
    incorrect: "text-coral",
  };

  const Icon = state === "correct" ? Check : state === "incorrect" ? X : null;

  return (
    <motion.button
      whileHover={!disabled ? { y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={cn(
        "w-full min-h-[96px] p-5 rounded-skylearn-lg border-2 text-left flex items-start justify-between gap-4 transition-all",
        stateClasses[state],
        selected && state === "idle" && "border-sky bg-sky-soft/30",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      animate={state === "incorrect" ? { x: [-4, 4, -4, 4, 0] } : {}}
      transition={state === "incorrect" ? { duration: 0.4 } : {}}
    >
      <div className="flex-1">
        {typeof children === "string" ? (
          <p className="text-ink font-medium text-lg">{children}</p>
        ) : (
          children
        )}
      </div>
      {Icon && state !== "idle" && (
        <div className={cn("shrink-0 mt-0.5", iconColors[state])}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </motion.button>
  );
}
