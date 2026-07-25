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

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 9999,
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: 16,
}

const backdropStyle: React.CSSProperties = {
  position: "absolute", inset: 0,
  background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
}

const dialogStyle: React.CSSProperties = {
  position: "relative", width: "100%", maxWidth: 520,
  borderRadius: 20, border: "1px solid #E2E8F0",
  background: "#fff", boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
  padding: "28px 24px 24px", maxHeight: "90vh", overflowY: "auto",
}

const headerStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  marginBottom: 16,
}

const titleStyle: React.CSSProperties = {
  fontSize: 18, fontWeight: 700, color: "#0F172A",
  display: "flex", alignItems: "center", gap: 8,
}

const closeBtnStyle: React.CSSProperties = {
  borderRadius: 9999, padding: 6, color: "#94A3B8",
  background: "none", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "background 150ms",
}

const descStyle: React.CSSProperties = {
  fontSize: "0.875rem", lineHeight: 1.7, color: "#475569",
  marginBottom: 20, textAlign: "center",
}

const devCardStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 14,
  padding: "14px 16px", borderRadius: 14,
  background: "#F8FAFC", border: "1px solid #E2E8F0",
  marginBottom: 10,
}

const avatarStyle: React.CSSProperties = {
  width: 56, height: 56, borderRadius: "50%",
  objectFit: "cover", border: "2px solid #E2E8F0",
}

const devNameStyle: React.CSSProperties = {
  fontSize: "0.95rem", fontWeight: 700, color: "#0F172A",
  margin: 0,
}

const devRoleStyle: React.CSSProperties = {
  fontSize: "0.8rem", color: "#64748B", margin: "2px 0 0",
}

const githubLinkStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontSize: "0.75rem", color: "#2563EB", fontWeight: 600,
  textDecoration: "none", marginTop: 4,
}

const footerStyle: React.CSSProperties = {
  marginTop: 20, paddingTop: 16,
  borderTop: "1px solid #E2E8F0",
  fontSize: "0.75rem", color: "#94A3B8",
  textAlign: "center", lineHeight: 1.6,
}

const badgeStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontSize: "0.625rem", fontWeight: 700, color: "#2563EB",
  textTransform: "uppercase", letterSpacing: "0.08em",
  background: "rgba(37,99,235,0.06)", padding: "3px 8px",
  borderRadius: 6, marginBottom: 12,
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

export function AboutButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <style>{`@media (max-width: 1023px) { .about-fab { bottom: 80px !important; } }`}</style>
      <button
        onClick={() => setOpen(true)}
        className="about-fab"
        style={{
          ...fabStyle,
          bottom: 24,
        }}
        aria-label="Tentang Aplikasi"
        title="Tentang Aplikasi"
      >
        <Info className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            style={overlayStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={backdropStyle} onClick={() => setOpen(false)} />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Tentang Aplikasi"
              style={dialogStyle}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
            >
              <div style={headerStyle}>
                <h3 style={titleStyle}>
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Tentang Aplikasi
                </h3>
                <button onClick={() => setOpen(false)} style={closeBtnStyle} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div style={badgeStyle}>
                <Sparkles className="h-3 w-3" />
                Web Absensi PKL
              </div>

              <p style={descStyle}>
                Web absensi ini dibuat dengan tujuan untuk memudahkan proses absensi
                dan monitoring kegiatan Praktik Kerja Lapangan (PKL) secara digital.
                Dibangun dengan teknologi modern untuk pengalaman yang cepat, aman,
                dan mudah digunakan oleh semua pihak.
              </p>

              {/* Developer 1 */}
              <div style={devCardStyle}>
                <img src={DEV1.avatar} alt={DEV1.name} style={avatarStyle} />
                <div style={{ flex: 1 }}>
                  <p style={devNameStyle}>{DEV1.name}</p>
                  <p style={devRoleStyle}>{DEV1.role}</p>
                  <a href={DEV1.github} target="_blank" rel="noopener noreferrer" style={githubLinkStyle}>
                    <Github className="h-3.5 w-3.5" />
                    {DEV1.github}
                  </a>
                </div>
              </div>

              {/* Developer 2 */}
              <div style={devCardStyle}>
                <img src={DEV2.avatar} alt={DEV2.name} style={avatarStyle} />
                <div style={{ flex: 1 }}>
                  <p style={devNameStyle}>{DEV2.name}</p>
                  <p style={devRoleStyle}>{DEV2.role}</p>
                  <a href={DEV2.github} target="_blank" rel="noopener noreferrer" style={githubLinkStyle}>
                    <Github className="h-3.5 w-3.5" />
                    {DEV2.github}
                  </a>
                </div>
              </div>

              <div style={footerStyle}>
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