/**
 * Modal — Dialog overlay dengan animasi Framer Motion
 * ====================================================
 * Menampilkan konten di atas backdrop buram.
 * Mendukung animasi masuk/keluar (AnimatePresence).
 *
 * Cara pakai:
 *   <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Konfirmasi">
 *     <p>Apakah Anda yakin?</p>
 *   </Modal>
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import styles from "@/styles/components/ui/Modal.module.css";

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Komponen
// ---------------------------------------------------------------------------

export function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop — klik di luar modal untuk menutup */}
          <motion.div
            className={styles.backdrop}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={styles.dialog}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
          >
            {/* Header: judul + tombol tutup */}
            <div className={styles.header}>
              <h3 className={styles.title}>{title}</h3>
              <button onClick={onClose} aria-label="Tutup" className={styles.closeBtn}>
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}