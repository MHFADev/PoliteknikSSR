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

function waitForEl(sel: string, timeout = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(sel)) { resolve(true); return }
    const obs = new MutationObserver(() => {
      if (document.querySelector(sel)) { obs.disconnect(); resolve(true) }
    })
    obs.observe(document.body, { childList: true, subtree: true })
    let elapsed = 0
    const iv = setInterval(() => {
      elapsed += 80
      if (document.querySelector(sel)) { clearInterval(iv); obs.disconnect(); resolve(true); return }
      if (elapsed >= timeout) { clearInterval(iv); obs.disconnect(); resolve(false) }
    }, 80)
  })
}

function clickEl(sel: string) { (document.querySelector(sel) as HTMLElement)?.click() }

export function TutorialOverlay({ role, onComplete }: Props) {
  const steps = useMemo(() => TUTORIAL_STEPS[role] || [], [role])
  const groups = useMemo(() => TUTORIAL_GROUPS[role] || [], [role])
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 1023px)")

  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const [uiState, setUiState] = useState<"loading" | "ready">("loading")
  const [found, setFound] = useState(true)
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
      setFound(true)

      const needNav = step.navigateTo && step.navigateTo !== window.location.pathname

      if (needNav) {
        router.push(step.navigateTo!)
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (cancelled) { clearInterval(check); resolve(); return }
            if (window.location.pathname === step.navigateTo) {
              clearInterval(check); resolve()
            }
          }, 50)
          setTimeout(() => { clearInterval(check); resolve() }, 2000)
        })
        await new Promise((r) => setTimeout(r, 150))
      }

      if (cancelled || !mountedRef.current) return

      if (!isMobile && step.expandSidebar) { clickEl("[data-tour='expand-sidebar']"); await new Promise((r) => setTimeout(r, 100)) }
      if (isMobile && step.expandMobileMore) { clickEl("[data-tour='expand-more']"); await new Promise((r) => setTimeout(r, 100)) }

      if (step.target) {
        const elFound = await waitForEl(step.waitFor || step.target, 2000)
        if (!mountedRef.current || cancelled) return
        if (!elFound) { setFound(false) } else { await new Promise((r) => setTimeout(r, 80)) }
      }

      if (!cancelled && mountedRef.current) setUiState("ready")
    }

    prepare()
    return () => { cancelled = true }
  }, [stepIdx, isMobile, router, current])

  // ── Position tooltip ──
  const updatePos = useCallback(() => {
    if (!current?.target || uiState !== "ready" || !found) { setRect(null); return }
    const el = document.querySelector(current.target) as HTMLElement | null
    if (!el) { setRect(null); return }

    const r = el.getBoundingClientRect()
    setRect(r)

    if (isMobile) { setTooltipPos({ top: 0, left: 0 }); return }

    const gap = 14, vw = window.innerWidth, vh = window.innerHeight
    const placement = current.placement || "right"
    let top = 0, left = 0, tw = 320

    if (placement === "right") {
      left = Math.min(r.right + gap, vw - tw - gap)
      top = Math.max(gap, Math.min(r.top + r.height / 2 - 80, vh - 240))
    } else if (placement === "bottom") {
      left = Math.max(gap, Math.min(r.left + r.width / 2 - tw / 2, vw - tw - gap))
      top = Math.min(r.bottom + gap, vh - 240)
    }

    setTooltipPos({ top, left })
  }, [current?.target, current?.placement, isMobile, uiState, found])

  useEffect(() => {
    if (uiState !== "ready") return
    updatePos()
    window.addEventListener("resize", updatePos)
    window.addEventListener("scroll", updatePos, true)
    const t1 = setTimeout(updatePos, 100)
    const t2 = setTimeout(updatePos, 400)
    return () => {
      window.removeEventListener("resize", updatePos)
      window.removeEventListener("scroll", updatePos, true)
      clearTimeout(t1); clearTimeout(t2)
    }
  }, [updatePos, uiState, stepIdx])

  if (!steps.length || !current) return null

  const goNext = () => {
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1)
    else onComplete()
  }
  const goPrev = () => { if (stepIdx > 0) setStepIdx(stepIdx - 1) }

  const isFirst = stepIdx === 0
  const isLast = stepIdx === steps.length - 1
  const hasTarget = !!current.target && found && !!rect

  // Page label
  let pageLabel = current.pageLabel || ""
  if (!pageLabel) {
    for (const g of groups) {
      if (g.steps.includes(current) && g.label !== "Selamat Datang") { pageLabel = g.label; break }
    }
  }

  const needsNav = current.navigateTo && current.navigateTo !== (typeof window !== "undefined" ? window.location.pathname : "")

  return (
    <AnimatePresence mode="wait">
      {uiState === "loading" && needsNav && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={styles.loadingOverlay}
        >
          <div className={styles.spinner} />
          <span className={styles.loadingText}>Membuka halaman...</span>
        </motion.div>
      )}

      {uiState === "ready" && (
        <motion.div
          key={`step-${stepIdx}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={styles.overlay}
        >
          {/* Backdrop */}
          {hasTarget && rect ? (
            <>
              <div key="top" className={styles.backdrop} style={{ top: 0, left: 0, right: 0, height: rect.top }} onClick={onComplete} />
              <div key="bottom" className={styles.backdrop} style={{ top: rect.bottom, left: 0, right: 0, height: `calc(100vh - ${rect.bottom}px)` }} onClick={onComplete} />
              <div key="left" className={styles.backdrop} style={{ top: rect.top, left: 0, width: rect.left, height: rect.height }} onClick={onComplete} />
              <div key="right" className={styles.backdrop} style={{ top: rect.top, left: rect.right, right: 0, height: rect.height }} onClick={onComplete} />
            </>
          ) : (
            <div className={styles.backdrop} style={{ inset: 0 }} onClick={onComplete} />
          )}

          {/* Highlight */}
          {hasTarget && rect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className={styles.highlight}
              style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }}
            />
          )}

          {/* Tooltip */}
          {isMobile ? (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.08 }}
              className={`${styles.tooltip} ${styles.tooltipMobile}`}
            >
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
              {/* Drag handle */}
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#CBD5E1", margin: "0 auto 8px" }} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.08 }}
              className={`${styles.tooltip} ${styles.tooltipDesktop}`}
              style={isFirst ? { top: "50%", left: "50%", transform: "translate(-50%,-50%)" } : { top: tooltipPos.top, left: tooltipPos.left, width: 320 }}
            >
              {!isFirst && current.placement === "right" && rect && (
                <div className={styles.arrow} style={{ left: -7, top: Math.min(80, rect.height / 2) - 7 }} />
              )}
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
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
