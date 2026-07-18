"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, SkipForward } from "lucide-react"
import { TUTORIAL_STEPS, TUTORIAL_GROUPS } from "@/lib/tutorial/steps"
import type { TutorialStep } from "@/lib/tutorial/steps"
import styles from "@/styles/components/tutorial/TutorialOverlay.module.css"

type Props = { role: "siswa" | "pembimbing"; onComplete: () => void }

function useMediaQuery(q: string): boolean {
  const [m, setM] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(q)
    setM(mq.matches)
    const h = (e: MediaQueryListEvent) => setM(e.matches)
    mq.addEventListener("change", h)
    return () => mq.removeEventListener("change", h)
  }, [q])
  return m
}

function q(sel: string): HTMLElement | null { return document.querySelector(sel) }

function waitForEl(sel: string, timeout = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    if (q(sel)) { resolve(true); return }
    const obs = new MutationObserver(() => { if (q(sel)) { obs.disconnect(); resolve(true) } })
    obs.observe(document.body, { childList: true, subtree: true })
    let elapsed = 0
    const iv = setInterval(() => {
      elapsed += 60
      if (q(sel)) { clearInterval(iv); obs.disconnect(); resolve(true); return }
      if (elapsed >= timeout) { clearInterval(iv); obs.disconnect(); resolve(false) }
    }, 60)
  })
}

export function TutorialOverlay({ role, onComplete }: Props) {
  const steps = useMemo(() => TUTORIAL_STEPS[role] || [], [role])
  const groups = useMemo(() => TUTORIAL_GROUPS[role] || [], [role])
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 1023px)")

  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [uiState, setUiState] = useState<"loading" | "ready">("loading")
  const [found, setFound] = useState(false)
  const mountedRef = useRef(true)
  const stepRef = useRef(stepIdx)
  stepRef.current = stepIdx

  useEffect(() => { return () => { mountedRef.current = false } }, [])

  const current: TutorialStep | undefined = steps[stepIdx]

  // ── Prepare step ──
  useEffect(() => {
    const step = current
    if (!step) return
    let cancelled = false

    async function prepare() {
      setUiState("loading")
      setRect(null)
      setFound(false)

      const needNav = step.navigateTo && step.navigateTo !== window.location.pathname

      if (needNav) {
        router.push(step.navigateTo!)
        let waited = 0
        while (waited < 1500) {
          if (cancelled) return
          if (window.location.pathname === step.navigateTo) break
          await new Promise((r) => setTimeout(r, 40))
          waited += 40
        }
        await new Promise((r) => setTimeout(r, 100))
      }

      if (cancelled || !mountedRef.current) return

      if (!isMobile && step.expandSidebar) { q("[data-tour='expand-sidebar']")?.click(); await new Promise((r) => setTimeout(r, 80)) }
      if (isMobile && step.expandMobileMore) { q("[data-tour='expand-more']")?.click(); await new Promise((r) => setTimeout(r, 80)) }

      if (step.target) {
        const exists = await waitForEl(step.waitFor || step.target, 1500)
        if (!mountedRef.current || cancelled) return
        if (exists) {
          setFound(true)
          const el = q(step.target!)
          if (el) setRect(el.getBoundingClientRect())
        }
      }

      if (!cancelled && mountedRef.current) setUiState("ready")
    }

    prepare()
    return () => { cancelled = true }
  }, [stepIdx, isMobile, router])

  // ── Recalc rect on resize/scroll ──
  useEffect(() => {
    if (uiState !== "ready" || !found || !current?.target) return
    const update = () => {
      const el = q(current.target!)
      if (el) setRect(el.getBoundingClientRect())
    }
    update()
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    const t = setTimeout(update, 300)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
      clearTimeout(t)
    }
  }, [uiState, found, current?.target, stepIdx])

  if (!steps.length || !current) return null

  const goNext = () => {
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1)
    else onComplete()
  }
  const goPrev = () => { if (stepIdx > 0) setStepIdx(stepIdx - 1) }

  const isFirst = stepIdx === 0
  const isLast = stepIdx === steps.length - 1
  const hasHighlight = found && !!rect

  // Page label
  let pageLabel = current.pageLabel || ""
  if (!pageLabel) {
    for (const g of groups) {
      if (g.steps.includes(current) && g.label !== "Selamat Datang") { pageLabel = g.label; break }
    }
  }

  const needsNav = current.navigateTo && current.navigateTo !== (typeof window !== "undefined" ? window.location.pathname : "")

  const tooltipContent = (
    <>
      <div className={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div className={styles.dots}>
            {steps.map((_, i) => (
              <span key={i} className={`${styles.dot} ${i === stepIdx ? styles.dotActive : styles.dotInactive}`} />
            ))}
          </div>
          <button onClick={onComplete} className={styles.closeBtn}><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className={styles.body}>
        {pageLabel && <div className={styles.pageLabel}>{pageLabel}</div>}
        <h3 className={styles.title}>{current.title}</h3>
        <p className={styles.desc}>{current.description}</p>
        <div className={styles.counter}>{stepIdx + 1} / {steps.length}</div>
      </div>
      <div className={styles.actions}>
        <button onClick={onComplete} className={styles.skipBtn}><SkipForward className="h-3.5 w-3.5" /> Skip</button>
        <div style={{ display: "flex", gap: 8 }}>
          {!isFirst && <button onClick={goPrev} className={styles.prevBtn}><ChevronLeft className="h-3.5 w-3.5" /> Prev</button>}
          <button onClick={goNext} className={styles.nextBtn}>{isLast ? "Selesai" : "Next"}{!isLast && <ChevronRight className="h-3.5 w-3.5" />}</button>
        </div>
      </div>
    </>
  )

  return (
    <AnimatePresence mode="wait">
      {uiState === "loading" && needsNav && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={styles.loadingOverlay}
        >
          <div className={styles.spinner} />
        </motion.div>
      )}

      {uiState === "ready" && (
        <motion.div
          key={`step-${stepIdx}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={styles.overlay}
        >
          {/* Backdrop */}
          {hasHighlight && rect ? (
            <>
              <div key="top" className={styles.backdrop} style={{ top: 0, left: 0, right: 0, height: rect.top }} onClick={onComplete} />
              <div key="bottom" className={styles.backdrop} style={{ top: rect.bottom, left: 0, right: 0, height: `calc(100vh - ${rect.bottom}px)` }} onClick={onComplete} />
              <div key="left" className={styles.backdrop} style={{ top: rect.top, left: 0, width: rect.left, height: rect.height }} onClick={onComplete} />
              <div key="right" className={styles.backdrop} style={{ top: rect.top, left: rect.right, right: 0, height: rect.height }} onClick={onComplete} />
            </>
          ) : (
            <div className={styles.backdrop} style={{ inset: 0 }} onClick={onComplete} />
          )}

          {/* Highlight ring only when element found */}
          {hasHighlight && rect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 24 }}
              className={styles.highlight}
              style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }}
            />
          )}

          {/* Tooltip - centered always, reliable */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 26, delay: 0.05 }}
            style={{
              position: "fixed",
              pointerEvents: "auto",
              zIndex: 10000,
            }}
            className={isMobile ? styles.tooltipMobileCard : styles.tooltipDesktopCard}
          >
            {tooltipContent}
            {isMobile && <div style={{ width: 36, height: 4, borderRadius: 2, background: "#CBD5E1", margin: "0 auto 8px" }} />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
