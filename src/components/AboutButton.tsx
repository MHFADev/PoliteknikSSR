"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Info, Github, Sparkles } from "lucide-react"
import styles from "@/styles/components/AboutButton.module.css"

const DEV1 = {
  name: "ZED-09",
  role: "Frontend Developer",
  github: "https://github.com/ZED-09",
  avatar: "https://avatars.githubusercontent.com/u/186075107?v=4",
}

const DEV2 = {
  name: "MHFADev",
  role: "Full Stack Developer",
  github: "https://github.com/MHFADev",
  avatar: "https://avatars.githubusercontent.com/u/149284463?v=4",
}

/**
 * AboutButton — trigger untuk membuka modal "Tentang Aplikasi".
 * Bukan FAB lagi; dipasang di Sidebar (desktop) & MobileNav (mobile).
 * Konten tombol bisa dikustomisasi via `children`, styling via `className`.
 */
export function AboutButton({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className}
        aria-label="Tentang Aplikasi"
        title="Tentang Aplikasi"
      >
        {children ?? (
          <>
            <Info className="h-5 w-5" />
            Tentang
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={styles.backdrop} onClick={() => setOpen(false)} />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Tentang Aplikasi"
              className={styles.dialog}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
            >
              <div className={styles.header}>
                <h3 className={styles.title}>
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Tentang Aplikasi
                </h3>
                <button onClick={() => setOpen(false)} className={styles.closeBtn} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className={styles.badge}>
                <Sparkles className="h-3 w-3" />
                Web Absensi PKL
              </div>

              <p className={styles.desc}>
                Web absensi ini dibuat dengan tujuan untuk memudahkan proses absensi dan monitoring kegiatan Praktik Kerja Lapangan (PKL) secara digital. Dibangun dengan teknologi modern untuk pengalaman yang cepat, aman, dan mudah digunakan oleh semua pihak.
              </p>

              <div className={styles.devList}>
                {[DEV1, DEV2].map((dev) => (
                  <div key={dev.name} className={styles.devCard}>
                    <img src={dev.avatar} alt={dev.name} className={styles.devAvatar} />
                    <div className={styles.devInfo}>
                      <p className={styles.devName}>{dev.name}</p>
                      <p className={styles.devRole}>{dev.role}</p>
                      <a href={dev.github} target="_blank" rel="noopener noreferrer" className={styles.devGithub}>
                        <Github className="h-3.5 w-3.5" />
                        {dev.github}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.footer}>
                Web ini dibuat oleh anak magang dari sekolah{" "}
                <strong>SMK PERSADA HUSADA INDONESIA</strong>, dan dibantu oleh pembimbing.
                <br />
                Politeknik SSR &copy; {new Date().getFullYear()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
