"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useId } from "react";
import styles from "@/styles/components/ui/Select.module.css";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className, ...props }: SelectProps) {
  const id = useId();

  return (
    <div className={styles.selectWrapper}>
      {label && (
        <label htmlFor={id} className={styles.selectLabel}>
          {label}
        </label>
      )}
      <div className={styles.selectContainer}>
        <select
          id={id}
          className={cn(styles.select, className)}
          {...props}
        />
        <ChevronDown className={styles.selectIcon} />
      </div>
      {error && <p className={styles.selectError}>{error}</p>}
    </div>
  );
}
