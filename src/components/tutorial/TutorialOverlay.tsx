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

function waitForEl(selector: string, timeout = 6000): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) return resolve()
    const obs = new MutationObserver(() => {
      if (document.querySelector(selector)) { obs.disconnect(); resolve() }
    })
    obs.observe(document.body, { childList: true, subtree: true })
    let elapsed = 0
    const iv = setInterval(() => {
      elapsed += 200
      if (document.querySelector(selector)) { clearInterval(iv); obs.disconnect(); resolve() }
      if (elapsed >= timeout) { clearInterval(iv); obs.disconnect(); resolve() }
    }, 200)
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
  const [uiState, setUiState] = useState<"loading" | "preparing" | "ready">("loading")
  const mountedRef = useRef(true)
  const stepRef = useRef(stepIdx)
  stepRef.current = stepIdx

  useEffect(() => { return () => { mountedRef.current = false } }, [])

  const current: TutorialStep | undefined = steps[stepIdx]

  // ── Prepare step: navigate + expand + wait ──
  useEffect(() => {
    const step = current
    if (!step) return
    let cancelled = false

    async function prepare() {
      setUiState("loading")
      setRect(null)

      const needNav = step.navigateTo && step.navigateTo !== window.location.pathname

      if (needNav) {
        router.push(step.navigateTo!)
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (cancelled) { clearInterval(check); resolve(); return }
            if (window.location.pathname === step.navigateTo) {
              clearInterval(check); resolve()
            }
          }, 100)
          setTimeout(() => { clearInterval(check); resolve() }, 5000)
        })
        await new Promise((r) => setTimeout(r, 400))
      }

      if (cancelled || !mountedRef.current) return
      setUiState("preparing")

      if (!isMobile && step.expandSidebar) {
        clickEl("[data-tour='expand-sidebar']")
        await new Promise((r) => setTimeout(r, 350))
      }
      if (isMobile && step.expandMobileMore) {
        clickEl("[data-tour='expand-more']")
        await new Promise((r) => setTimeout(r, 350))
      }

      if (step.target) {
        await waitForEl(step.waitFor || step.target, 4000)
        await new Promise((r) => setTimeout(r, 150))
      }

      if (!cancelled && mountedRef.current) setUiState("ready")
    }

    setUiState("loading")
    prepare()
    return () => { cancelled = true }
  }, [stepIdx, isMobile, router, current])

  // ── Position tooltip ──
  const updatePos = useCallback(() => {
    if (!current?.target || uiState !== "ready") { setRect(null); return }
    const el = document.querySelector(current.target) as HTMLElement | null
    if (!el) { setRect(null); return }

    const r = el.getBoundingClientRect()
    setRect(r)

    if (isMobile) {
      setTooltipPos({ top: 0, left: 0 })
      return
    }

    const gap = 14, vw = window.innerWidth, vh = window.innerHeight
    const placement = current.placement || "right"
    let top = 0, left = 0, tw = 312

    if (placement === "right") {
      left = Math.min(r.right + gap, vw - tw - gap)
      top = Math.max(gap, Math.min(r.top + r.height / 2 - 90, vh - 260))
    } else if (placement === "bottom") {
      left = Math.max(gap, Math.min(r.left + r.width / 2 - tw / 2, vw - tw - gap))
      top = Math.min(r.bottom + gap, vh - 260)
    }

    setTooltipPos({ top, left })
  }, [current?.target, current?.placement, isMobile, uiState])

  useEffect(() => {
    if (uiState !== "ready") return
    updatePos()
    window.addEventListener("resize", updatePos)
    window.addEventListener("scroll", updatePos, true)
    const t1 = setTimeout(updatePos, 300)
    const t2 = setTimeout(updatePos, 800)
    return () => {
      window.removeEventListener("resize", updatePos)
      window.removeEventListener("scroll", updatePos, true)
      clearTimeout(t1); clearTimeout(t2)
    }
  }, [updatePos, uiState, stepIdx])

  // ── Early return after all hooks ──
  if (!steps.length || !current) return null

  const goNext = () => {
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1)
    else onComplete()
  }
  const goPrev = () => { if (stepIdx > 0) setStepIdx(stepIdx - 1) }

  const isFirst = stepIdx === 0
  const isLast = stepIdx === steps.length - 1
  const hasTarget = !!current.target

  // Compute page label
  let pageLabel = current.pageLabel || ""
  if (!pageLabel) {
    for (const g of groups) {
      g.steps.some((s) => {
        if (s === current && g.label !== "Selamat Datang") { pageLabel = g.label; return true }
        return false
      })
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
          transition={{ duration: 0.25 }}
          className={styles.overlay}
        >
          {/* Backdrop */}
          {hasTarget && rect && (
            <>
              <div className={styles.backdrop} style={{ top: 0, left: 0, right: 0, height: rect.top }} onClick={onComplete} />
              <div className={styles.backdrop} style={{ top: rect.bottom, left: 0, right: 0, height: `calc(100vh - ${rect.bottom}px)` }} onClick={onComplete} />
              <div className={styles.backdrop} style={{ top: rect.top, left: 0, width: rect.left, height: rect.height }} onClick={onComplete} />
              <div className={styles.backdrop} style={{ top: rect.top, left: rect.right, right: 0, height: rect.height }} onClick={onComplete} />
            </>
          )}
          {!hasTarget && (
            <div className={styles.backdrop} style={{ inset: 0 }} onClick={onComplete} />
          )}

          {/* Spotlight */}
          {hasTarget && rect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={styles.highlight}
              style={{ top: rect.top - 5, left: rect.left - 5, width: rect.width + 10, height: rect.height + 10 }}
            />
          )}

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26, delay: 0.1 }}
            className={`${styles.tooltip} ${isMobile ? styles.tooltipMobile : (isFirst ? styles.tooltipCenter : styles.tooltipDesktop)}`}
            style={!isMobile && !isFirst ? { top: tooltipPos.top, left: tooltipPos.left, width: 312 } : {}}
          >
            {!isMobile && !isFirst && current.placement === "right" && rect && (
              <div className={styles.arrow} style={{ left: -7, top: Math.min(90, rect.height / 2) - 7 }} />
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
              <button onClick={onComplete} className={styles.skipBtn}>
                <SkipForward className="h-3.5 w-3.5" /> Skip
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                {!isFirst && (
                  <button onClick={goPrev} className={styles.prevBtn}>
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </button>
                )}
                <button onClick={goNext} className={styles.nextBtn}>
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
