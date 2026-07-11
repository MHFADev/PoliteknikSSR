"use client";

import { cn } from "@/lib/utils";
import styles from "@/styles/components/ui/Input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className={styles.fieldGroup}>
      {label && (
        <label className={styles.label}>{label}</label>
      )}
      <input
        className={cn(
          styles.inputBase,
          error && styles.inputError,
          className
        )}
        {...props}
      />
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}