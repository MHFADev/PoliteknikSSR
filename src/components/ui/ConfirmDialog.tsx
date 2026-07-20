"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Info, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Ya",
  cancelLabel = "Batal",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const iconMap = {
    danger: <AlertTriangle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  };

  const colorMap = {
    danger: { icon: "#EF4444", iconBg: "#FEF2F2", confirm: "#EF4444", confirmHover: "#DC2626" },
    warning: { icon: "#F59E0B", iconBg: "#FFFBEB", confirm: "#F59E0B", confirmHover: "#D97706" },
    info: { icon: "#3B82F6", iconBg: "#EFF6FF", confirm: "#3B82F6", confirmHover: "#2563EB" },
  };

  const colors = colorMap[variant];

  return (
    <AnimatePresence>
      {open && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}>
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.5)",
              backdropFilter: "blur(4px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "400px",
              background: "var(--bg-card, #ffffff)",
              borderRadius: "16px",
              border: "1px solid var(--color-outline, #E2E8F0)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
              padding: "1.5rem",
            }}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <button
              onClick={onClose}
              aria-label="Tutup"
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                borderRadius: "9999px",
                padding: "4px",
                color: "var(--color-mist-dim, #94A3B8)",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <X className="h-4 w-4" />
            </button>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: colors.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: colors.icon,
              }}>
                {iconMap[variant]}
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--color-deep, #0F172A)",
                  margin: 0,
                  paddingRight: "1.5rem",
                }}>
                  {title}
                </h3>
                <p style={{
                  fontSize: "0.875rem",
                  color: "var(--color-mist-dim, #64748B)",
                  margin: "0.375rem 0 0",
                  lineHeight: 1.5,
                }}>
                  {message}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--color-mist-dim, #64748B)",
                  background: "var(--color-surface-elevated, #F1F5F9)",
                  border: "1px solid var(--color-outline, #E2E8F0)",
                  borderRadius: "0.5rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 150ms",
                }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#fff",
                  background: loading ? "#94A3B8" : colors.confirm,
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 150ms",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = colors.confirmHover; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = colors.confirm; }}
              >
                {loading && (
                  <span style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                  }} />
                )}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
