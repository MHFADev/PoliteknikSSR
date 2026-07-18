"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, SkipForward } from "lucide-react"
import { TUTORIAL_STEPS } from "@/lib/tutorial/steps"
import type { TutorialStep } from "@/lib/tutorial/steps"

type TutorialOverlayProps = {
  role: "siswa" | "pembimbing"
  onComplete: () => void
}

function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    setMatch(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMatch(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [query])
  return match
}

function waitForElement(selector: string, timeout = 5000): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) return resolve()
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect()
        resolve()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => { observer.disconnect(); resolve() }, timeout)
  })
}

function doClick(selector: string) {
  const el = document.querySelector(selector) as HTMLElement | null
  el?.click()
}

export function TutorialOverlay({ role, onComplete }: TutorialOverlayProps) {
  const steps = TUTORIAL_STEPS[role] || []
  const router = useRouter()
  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const [tooltipPlacement, setTooltipPlacement] = useState("bottom")
  const [ready, setReady] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const [waitingForTarget, setWaitingForTarget] = useState(false)
  const mountedRef = useRef(true)
  const isMobile = useMediaQuery("(max-width: 1023px)")

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  const current = steps[stepIdx]

  // ── Navigate & wait for target before showing step ──
  useEffect(() => {
    if (!current) return
    let cancelled = false

    async function prepare() {
      // Navigate if needed
      if (current.navigateTo && current.navigateTo !== window.location.pathname) {
        setNavigating(true)
        setRect(null)
        router.push(current.navigateTo)
        // Wait for navigation + DOM settle
        await new Promise((r) => setTimeout(r, 600))
        await waitForElement(current.waitFor || "main", 4000)
      }

      if (cancelled || !mountedRef.current) return
      setNavigating(false)

      // Expand sidebar / mobile more if needed
      if (!isMobile && current.expandSidebar) {
        doClick("[data-tour='expand-sidebar']")
        await new Promise((r) => setTimeout(r, 300))
      }
      if (isMobile && current.expandMobileMore) {
        doClick("[data-tour='expand-more']")
        await new Promise((r) => setTimeout(r, 300))
      }

      if (cancelled || !mountedRef.current) return

      // Wait for target element
      if (current.target) {
        setWaitingForTarget(true)
        await waitForElement(current.target, 3000)
        await new Promise((r) => setTimeout(r, 100))
      }
      if (!cancelled && mountedRef.current) {
        setWaitingForTarget(false)
        setReady(true)
      }
    }

    setReady(false)
    prepare()

    return () => { cancelled = true }
  }, [stepIdx, current?.navigateTo, isMobile, router])

  // ── Position tooltip ──
  const updatePosition = useCallback(() => {
    if (!current?.target) { setRect(null); return }
    const el = document.querySelector(current.target) as HTMLElement | null
    if (!el) { setRect(null); return }

    const r = el.getBoundingClientRect()
    setRect(r)

    const placement = current.placement || "right"
    if (isMobile) {
      setTooltipPlacement("bottom")
      setTooltipPos({ top: 0, left: 0 })
    } else {
      setTooltipPlacement(placement)
      const gap = 12
      const vw = window.innerWidth
      const vh = window.innerHeight
      let top = 0, left = 0

      if (placement === "right") {
        left = Math.min(r.right + gap, vw - 320)
        top = Math.max(gap, Math.min(r.top + r.height / 2 - 80, vh - 240))
      } else if (placement === "left") {
        left = Math.max(gap, r.left - 320 - gap)
        top = Math.max(gap, Math.min(r.top + r.height / 2 - 80, vh - 240))
      } else if (placement === "bottom") {
        left = Math.max(gap, Math.min(r.left + r.width / 2 - 160, vw - 320))
        top = Math.min(r.bottom + gap, vh - 240)
      } else {
        left = Math.max(gap, Math.min(r.left + r.width / 2 - 160, vw - 320))
        top = Math.max(gap, r.top - 240 - gap)
      }

      setTooltipPos({ top, left })
    }
  }, [current, isMobile])

  useEffect(() => {
    if (!ready) return
    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    const t = setTimeout(updatePosition, 500)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
      clearTimeout(t)
    }
  }, [updatePosition, ready, stepIdx])

  if (!steps.length) return null

  const goNext = () => {
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1)
    else onComplete()
  }

  const goPrev = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1)
  }

  const isFirst = stepIdx === 0
  const isLast = stepIdx === steps.length - 1
  const hasTarget = !!current.target

  const showOverlay = ready && !navigating && !waitingForTarget

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          key={stepIdx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="tutorial-overlay"
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          {/* Backdrop */}
          {hasTarget && rect && (
            <>
              <div style={{
                position: "fixed", top: 0, left: 0, right: 0, height: rect.top,
                background: "rgba(0,0,0,0.55)", pointerEvents: "auto",
              }} onClick={onComplete} />
              <div style={{
                position: "fixed", top: rect.bottom, left: 0, right: 0,
                height: `calc(100vh - ${rect.bottom}px)`,
                background: "rgba(0,0,0,0.55)", pointerEvents: "auto",
              }} onClick={onComplete} />
              <div style={{
                position: "fixed", top: rect.top, left: 0,
                width: rect.left, height: rect.height,
                background: "rgba(0,0,0,0.55)", pointerEvents: "auto",
              }} onClick={onComplete} />
              <div style={{
                position: "fixed", top: rect.top,
                left: rect.right, right: 0, height: rect.height,
                background: "rgba(0,0,0,0.55)", pointerEvents: "auto",
              }} onClick={onComplete} />
            </>
          )}
          {!hasTarget && (
            <div style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.55)", pointerEvents: "auto",
            }} />
          )}

          {/* Highlight ring */}
          {hasTarget && rect && (
            <div style={{
              position: "fixed",
              top: rect.top - 4, left: rect.left - 4,
              width: rect.width + 8, height: rect.height + 8,
              border: "2px solid #fff",
              borderRadius: 8,
              pointerEvents: "none",
              boxShadow: "0 0 20px rgba(59,130,246,0.4)",
            }} />
          )}

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              position: "fixed",
              pointerEvents: "auto",
              ...(isMobile
                ? { bottom: 0, left: 0, right: 0 }
                : isFirst
                  ? { top: "50%", left: "50%", transform: "translate(-50%,-50%)" }
                  : { top: tooltipPos.top, left: tooltipPos.left, width: 304 }
              ),
              background: "#fff",
              borderRadius: isMobile ? "16px 16px 0 0" : 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              zIndex: 10000,
            }}
          >
            {!isMobile && tooltipPlacement === "right" && rect && (
              <div style={{
                position: "absolute", left: -6, top: Math.min(80, rect.height / 2) - 6,
                width: 12, height: 12, background: "#fff", transform: "rotate(45deg)",
              }} />
            )}

            <div style={{ padding: "1.25rem 1.25rem 0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{
                  display: "flex", gap: 6,
                  fontSize: "0.6875rem", fontWeight: 600, color: "#94A3B8",
                }}>
                  {steps.map((_, i) => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: i === stepIdx ? "#2563EB" : "#CBD5E1",
                      transition: "background 0.2s",
                    }} />
                  ))}
                </div>
                <button onClick={onComplete} style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 2, color: "#94A3B8",
                }}>
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h3 style={{
                fontSize: "1rem", fontWeight: 700, color: "#0F172A",
                marginBottom: 4,
              }}>
                {current.navigateTo && current.navigateTo !== window.location.pathname
                  ? `➜ ${current.title}`
                  : current.title}
              </h3>
              <p style={{
                fontSize: "0.8125rem", color: "#475569", lineHeight: 1.5,
                marginBottom: 12,
              }}>
                {current.description}
              </p>

              <div style={{
                fontSize: "0.6875rem", color: "#94A3B8", marginBottom: 8,
              }}>
                {stepIdx + 1} / {steps.length}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, padding: "0 1.25rem 1rem" }}>
              <button onClick={onComplete} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "0.5rem 0.75rem", borderRadius: 8,
                border: "1px solid #E2E8F0", background: "#fff",
                fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8",
                cursor: "pointer",
              }}>
                <SkipForward className="h-3.5 w-3.5" />
                Skip
              </button>

              <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                {!isFirst && (
                  <button onClick={goPrev} style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "0.5rem 0.75rem", borderRadius: 8,
                    border: "1px solid #E2E8F0", background: "#fff",
                    fontSize: "0.75rem", fontWeight: 600, color: "#475569",
                    cursor: "pointer",
                  }}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </button>
                )}
                <button onClick={goNext} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "0.5rem 1rem", borderRadius: 8,
                  border: "none", background: "#2563EB",
                  fontSize: "0.75rem", fontWeight: 600, color: "#fff",
                  cursor: "pointer",
                }}>
                  {isLast ? "Selesai" : "Next"}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
