"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Bug, AlertTriangle, Lightbulb, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { sendReport } from "@/actions/report"

const REPORT_TYPES = [
  { value: "Bug", label: "Bug / Error", icon: Bug, color: "#EF4444" },
  { value: "Saran", label: "Saran", icon: Lightbulb, color: "#F59E0B" },
  { value: "Masalah Akun", label: "Masalah Akun", icon: AlertTriangle, color: "#8B5CF6" },
  { value: "Lainnya", label: "Lainnya", icon: AlertCircle, color: "#64748B" },
]

type Props = { open: boolean; onClose: () => void }

export function ReportDialog({ open, onClose }: Props) {
  const [type, setType] = useState("Bug")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    setStatus(null)
    const res = await sendReport(type, message.trim())
    setStatus({ ok: !res.error, msg: res.error || "Laporan berhasil dikirim! Terima kasih." })
    setSending(false)
    if (!res.error) {
      setMessage("")
      setTimeout(() => { setStatus(null); onClose() }, 2000)
    }
  }

  const s = (obj: Record<string, string>) => obj as React.CSSProperties

  return (
    <AnimatePresence>
      {open && (
        <motion.div style={s({ position: "fixed", inset: "0", zIndex: "9999", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" })} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div style={s({ position: "absolute", inset: "0", background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" })} onClick={onClose} />
          <motion.div role="dialog" aria-modal="true" aria-label="Lapor"
            style={s({ position: "relative", width: "100%", maxWidth: "480px", borderRadius: "20px", border: "1px solid var(--color-outline)", background: "var(--bg-card)", boxShadow: "0 16px 48px rgba(0,0,0,0.12)", padding: "24px", maxHeight: "90vh", overflowY: "auto" })}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
          >
            <div style={s({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" })}>
              <h3 style={s({ fontSize: "18px", fontWeight: "700", color: "var(--color-deep)", display: "flex", alignItems: "center", gap: "8px", margin: "0" })}>
                <Bug className="h-5 w-5 text-indigo-500" />
                Lapor
              </h3>
              <button onClick={onClose} style={s({ borderRadius: "9999px", padding: "6px", color: "var(--color-ink-subtle)", background: "none", border: "none", cursor: "pointer" })}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <p style={s({ fontSize: "0.8125rem", color: "var(--color-mist-dim)", margin: "0 0 16px", lineHeight: "1.6" })}>
              Temukan bug? Punya saran? Lapor langsung ke developer. Laporan akan dikirim ke Discord dan ditindaklanjuti secepatnya.
            </p>

            <div style={s({ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" })}>
              {REPORT_TYPES.map((t) => {
                const active = type === t.value
                const Icon = t.icon
                return (
                  <button key={t.value} type="button" onClick={() => setType(t.value)}
                    style={s({ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", border: active ? `2px solid ${t.color}` : "1px solid var(--color-outline)", background: active ? `${t.color}10` : "var(--bg-card)", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600", color: active ? t.color : "var(--color-ink-muted)", transition: "all 0.15s" })}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                )
              })}
            </div>

            <label style={s({ fontSize: "0.8125rem", fontWeight: "600", color: "var(--color-deep)", marginBottom: "6px", display: "block" })}>
              Deskripsi Laporan
            </label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5}
              placeholder="Jelaskan secara detail apa yang terjadi..."
              style={s({ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--color-outline)", fontSize: "0.8125rem", lineHeight: "1.6", resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "var(--bg-input)", color: "var(--color-ink)" })}
            />

            {status && (
              <div style={s({ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", marginTop: "12px", background: status.ok ? "#F0FDF4" : "#FEF2F2", color: status.ok ? "#166534" : "#991B1B", fontSize: "0.8125rem", fontWeight: "500" })}>
                {status.ok ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                {status.msg}
              </div>
            )}

            <div style={s({ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" })}>
              <button onClick={onClose} style={s({ padding: "8px 16px", borderRadius: "10px", border: "1px solid var(--color-outline)", background: "var(--bg-card)", fontSize: "0.8125rem", fontWeight: "600", color: "var(--color-ink-muted)", cursor: "pointer" })}>
                Batal
              </button>
              <button onClick={handleSend} disabled={sending || !message.trim()}
                style={s({ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "10px", border: "none", background: !message.trim() ? "var(--color-ink-subtle)" : "linear-gradient(135deg, #6366F1, #4F46E5)", color: "#fff", fontSize: "0.8125rem", fontWeight: "600", cursor: sending || !message.trim() ? "not-allowed" : "pointer", transition: "all 0.15s" })}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Mengirim..." : "Kirim Laporan"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}