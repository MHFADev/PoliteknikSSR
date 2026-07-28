"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Info, Github, Sparkles } from "lucide-react"

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

const fabStyle: React.CSSProperties = {
  position: "fixed", bottom: 88, right: 20, zIndex: 40,
  width: 44, height: 44, borderRadius: "50%",
  border: "none", cursor: "pointer",
  background: "linear-gradient(135deg, #2563EB, #4F46E5)",
  color: "#fff", display: "flex", alignItems: "center",
  justifyContent: "center", boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
  transition: "transform 0.2s, box-shadow 0.2s",
}

const s = (obj: Record<string, string>) => obj as React.CSSProperties

export function AboutButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <style>{`@media (max-width: 1023px) { .about-fab { bottom: 80px !important; } }`}</style>
      <button
        onClick={() => setOpen(true)}
        className="about-fab"
        style={{ ...fabStyle, bottom: 24 } as React.CSSProperties}
        aria-label="Tentang Aplikasi"
        title="Tentang Aplikasi"
      >
        <Info className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            style={s({ position: "fixed", inset: "0", zIndex: "9999", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" })}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={s({ position: "absolute", inset: "0", background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" })} onClick={() => setOpen(false)} />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Tentang Aplikasi"
              style={s({ position: "relative", width: "100%", maxWidth: "520px", borderRadius: "20px", border: "1px solid var(--color-outline)", background: "var(--bg-card)", boxShadow: "0 16px 48px rgba(0,0,0,0.12)", padding: "28px 24px 24px", maxHeight: "90vh", overflowY: "auto" })}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
            >
              <div style={s({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" })}>
                <h3 style={s({ fontSize: "18px", fontWeight: "700", color: "var(--color-deep)", display: "flex", alignItems: "center", gap: "8px", margin: "0" })}>
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Tentang Aplikasi
                </h3>
                <button onClick={() => setOpen(false)} style={s({ borderRadius: "9999px", padding: "6px", color: "var(--color-ink-subtle)", background: "none", border: "none", cursor: "pointer" })} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div style={s({ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.625rem", fontWeight: "700", color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(37,99,235,0.06)", padding: "3px 8px", borderRadius: "6px", marginBottom: "12px" })}>
                <Sparkles className="h-3 w-3" />
                Web Absensi PKL
              </div>

              <p style={s({ fontSize: "0.875rem", lineHeight: "1.7", color: "var(--color-mist-dim)", marginBottom: "20px", textAlign: "center" })}>
                Web absensi ini dibuat dengan tujuan untuk memudahkan proses absensi dan monitoring kegiatan Praktik Kerja Lapangan (PKL) secara digital. Dibangun dengan teknologi modern untuk pengalaman yang cepat, aman, dan mudah digunakan oleh semua pihak.
              </p>

              {[DEV1, DEV2].map((dev) => (
                <div key={dev.name} style={s({ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", borderRadius: "14px", background: "var(--bg-page)", border: "1px solid var(--color-outline)", marginBottom: "10px" })}>
                  <img src={dev.avatar} alt={dev.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--color-outline)" } as React.CSSProperties} />
                  <div style={{ flex: 1 } as React.CSSProperties}>
                    <p style={s({ fontSize: "0.95rem", fontWeight: "700", color: "var(--color-deep)", margin: "0" })}>{dev.name}</p>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-mist-dim)", margin: "2px 0 0" } as React.CSSProperties}>{dev.role}</p>
                    <a href={dev.github} target="_blank" rel="noopener noreferrer" style={s({ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "#2563EB", fontWeight: "600", textDecoration: "none", marginTop: "4px" })}>
                      <Github className="h-3.5 w-3.5" />
                      {dev.github}
                    </a>
                  </div>
                </div>
              ))}

              <div style={s({ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--color-outline)", fontSize: "0.75rem", color: "var(--color-ink-subtle)", textAlign: "center", lineHeight: "1.6" })}>
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