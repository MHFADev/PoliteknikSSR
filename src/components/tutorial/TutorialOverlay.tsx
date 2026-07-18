"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, SkipForward, Sparkles } from "lucide-react"
import { TUTORIAL_STEPS, TUTORIAL_GROUPS } from "@/lib/tutorial/steps"
import type { TutorialStep } from "@/lib/tutorial/steps"
import styles from "@/styles/components/tutorial/TutorialOverlay.module.css"

type Props = { role: "siswa" | "pembimbing"; onComplete: () => void }

function q(sel: string): HTMLElement | null { return document.querySelector(sel) }

function waitForEl(sel: string, timeout = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    if (q(sel)) { resolve(true); return }
    const obs = new MutationObserver(() => { if (q(sel)) { obs.disconnect(); resolve(true) } })
    obs.observe(document.body, { childList: true, subtree: true })
    let elapsed = 0
    const iv = setInterval(() => {
      elapsed += 50
      if (q(sel)) { clearInterval(iv); obs.disconnect(); resolve(true); return }
      if (elapsed >= timeout) { clearInterval(iv); obs.disconnect(); resolve(false) }
    }, 50)
  })
}

function calcPlacement(targetRect: DOMRect, tooltipW: number, tooltipH: number, gap = 14) {
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Try "right" first
  let left = targetRect.right + gap
  let top = targetRect.top + targetRect.height / 2 - tooltipH / 2
  if (left + tooltipW <= vw - 16 && top >= 16 && top + tooltipH <= vh - 16) {
    return { left, top, arrow: "left" as const }
  }

  // Try "left"
  left = targetRect.left - tooltipW - gap
  top = targetRect.top + targetRect.height / 2 - tooltipH / 2
  if (left >= 16 && top >= 16 && top + tooltipH <= vh - 16) {
    return { left, top, arrow: "right" as const }
  }

  // Try "bottom"
  left = targetRect.left + targetRect.width / 2 - tooltipW / 2
  top = targetRect.bottom + gap
  if (left >= 16 && left + tooltipW <= vw - 16 && top + tooltipH <= vh - 16) {
    return { left, top, arrow: "top" as const }
  }

  // Try "top"
  top = targetRect.top - tooltipH - gap
  left = targetRect.left + targetRect.width / 2 - tooltipW / 2
  if (left >= 16 && left + tooltipW <= vw - 16 && top >= 16) {
    return { left, top, arrow: "bottom" as const }
  }

  // Fallback: center
  return { left: vw / 2 - tooltipW / 2, top: vh / 2 - tooltipH / 2, arrow: null }
}

export function TutorialOverlay({ role, onComplete }: Props) {
  const steps = useMemo(() => TUTORIAL_STEPS[role] || [], [role])
  const groups = useMemo(() => TUTORIAL_GROUPS[role] || [], [role])
  const router = useRouter()

  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [uiState, setUiState] = useState<"loading" | "ready">("loading")
  const [found, setFound] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number; arrow: "left" | "right" | "top" | "bottom" | null }>({ left: 0, top: 0, arrow: null })
  const mountedRef = useRef(true)
  const stepRef = useRef(stepIdx)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const navigatedRef = useRef(false)
  stepRef.current = stepIdx

  useEffect(() => { return () => { mountedRef.current = false } }, [])

  const current: TutorialStep | undefined = steps[stepIdx]

  // ── Calculate tooltip position ──
  const calcTooltipPos = useCallback(() => {
    if (!found || !rect) {
      // Center fallback
      setTooltipPos({ left: window.innerWidth / 2 - 190, top: window.innerHeight / 2 - 150, arrow: null })
      return
    }
    const tw = tooltipRef.current?.offsetWidth || 380
    const th = tooltipRef.current?.offsetHeight || 260
    setTooltipPos(calcPlacement(rect, tw, th))
  }, [found, rect])

  useEffect(() => {
    calcTooltipPos()
    window.addEventListener("resize", calcTooltipPos)
    return () => window.removeEventListener("resize", calcTooltipPos)
  }, [calcTooltipPos])

  // ── Prepare step ──
  useEffect(() => {
    const step = current
    if (!step) return
    let cancelled = false

    async function prepare() {
      setUiState("loading")
      setRect(null)
      setFound(false)

      const currentPath = window.location.pathname
      const needNav = step.navigateTo && step.navigateTo !== currentPath

      if (needNav) {
        navigatedRef.current = true
        router.push(step.navigateTo!)
        // Wait for pathname to actually change
        let waited = 0
        while (waited < 3000) {
          if (cancelled) return
          if (window.location.pathname === step.navigateTo) break
          await new Promise((r) => setTimeout(r, 30))
          waited += 30
        }
        // Extra settle time for DOM to fully render after navigation
        await new Promise((r) => setTimeout(r, 250))
      } else {
        navigatedRef.current = false
      }

      if (cancelled || !mountedRef.current) return

      // Expand sidebar if needed
      if (!window.matchMedia("(max-width: 1023px)").matches && step.expandSidebar) {
        const expandBtn = q("[data-tour='expand-sidebar']")
        if (expandBtn) { expandBtn.click(); await new Promise((r) => setTimeout(r, 120)) }
      }
      if (window.matchMedia("(max-width: 1023px)").matches && step.expandMobileMore) {
        const expandBtn = q("[data-tour='expand-more']")
        if (expandBtn) { expandBtn.click(); await new Promise((r) => setTimeout(r, 120)) }
      }

      // Find target element
      if (step.target) {
        // Try immediate find first
        let el = q(step.target)
        if (!el) {
          // Wait with MutationObserver + polling (longer timeout)
          const found2 = await waitForEl(step.waitFor || step.target, 4000)
          if (!mountedRef.current || cancelled) return
          if (found2) el = q(step.target)
        }

        if (el) {
          setFound(true)
          setRect(el.getBoundingClientRect())
        } else {
          // Element truly not found — proceed without highlight (centered card)
          setFound(false)
        }
      }

      if (!cancelled && mountedRef.current) setUiState("ready")
    }

    prepare()
    return () => { cancelled = true }
  }, [stepIdx, router, current])

  // ── Recalc rect on resize/scroll ──
  useEffect(() => {
    if (uiState !== "ready" || !current?.target) return
    const update = () => {
      const el = q(current.target!)
      if (el) {
        setRect(el.getBoundingClientRect())
        setFound(true)
      }
    }
    update()
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    const t = setTimeout(update, 400)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
      clearTimeout(t)
    }
  }, [uiState, current?.target, stepIdx])

  // ── Keyboard navigation ──
  useEffect(() => {
    if (uiState !== "ready") return
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); goNext() }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goPrev() }
      else if (e.key === "Escape") { e.preventDefault(); onComplete() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [uiState, stepIdx, steps.length])

  if (!steps.length || !current) return null

  const goNext = () => {
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1)
    else onComplete()
  }
  const goPrev = () => { if (stepIdx > 0) setStepIdx(stepIdx - 1) }

  const isFirst = stepIdx === 0
  const isLast = stepIdx === steps.length - 1
  const hasHighlight = found && !!rect
  const progress = ((stepIdx + 1) / steps.length) * 100

  // Page label
  let pageLabel = current.pageLabel || ""
  if (!pageLabel) {
    for (const g of groups) {
      if (g.steps.includes(current) && g.label !== "Selamat Datang") { pageLabel = g.label; break }
    }
  }

  const needsNav = current.navigateTo && current.navigateTo !== (typeof window !== "undefined" ? window.location.pathname : "")

  // Arrow position for tooltip
  const arrowStyle: React.CSSProperties = {}
  if (tooltipPos.arrow === "left") {
    arrowStyle.left = -7; arrowStyle.top = "50%"; arrowStyle.transform = "translateY(-50%) rotate(45deg)"
  } else if (tooltipPos.arrow === "right") {
    arrowStyle.right = -7; arrowStyle.top = "50%"; arrowStyle.transform = "translateY(-50%) rotate(45deg)"
  } else if (tooltipPos.arrow === "top") {
    arrowStyle.top = -7; arrowStyle.left = "50%"; arrowStyle.transform = "translateX(-50%) rotate(45deg)"
  } else if (tooltipPos.arrow === "bottom") {
    arrowStyle.bottom = -7; arrowStyle.left = "50%"; arrowStyle.transform = "translateX(-50%) rotate(45deg)"
  }

  const tooltipContent = (
    <>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <motion.div
          className={styles.progressFill}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>
      <div className={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className={styles.dots}>
            {steps.map((_, i) => (
              <span key={i} className={`${styles.dot} ${i === stepIdx ? styles.dotActive : i < stepIdx ? styles.dotDone : styles.dotInactive}`} />
            ))}
          </div>
          <button onClick={onComplete} className={styles.closeBtn} aria-label="Skip tutorial"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className={styles.body}>
        {pageLabel && (
          <div className={styles.pageLabel}>
            <Sparkles className="h-3 w-3" />
            {pageLabel}
          </div>
        )}
        <h3 className={styles.title}>{current.title}</h3>
        <p className={styles.desc}>{current.description}</p>
        <div className={styles.counter}>{stepIdx + 1} / {steps.length}</div>
      </div>
      <div className={styles.actions}>
        <button onClick={onComplete} className={styles.skipBtn}><SkipForward className="h-3.5 w-3.5" /> Lewati</button>
        <div style={{ display: "flex", gap: 8 }}>
          {!isFirst && <button onClick={goPrev} className={styles.prevBtn}><ChevronLeft className="h-3.5 w-3.5" /> Kembali</button>}
          <button onClick={goNext} className={styles.nextBtn}>
            {isLast ? "Selesai" : "Lanjut"}
            {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
          </button>
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
          transition={{ duration: 0.2 }}
          className={styles.loadingOverlay}
        >
          <div className={styles.loadingContent}>
            <div className={styles.spinner} />
            <span className={styles.loadingText}>Memuat halaman...</span>
          </div>
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
          {hasHighlight && rect ? (
            <>
              <motion.div
                key="backdrop-top"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={styles.backdrop}
                style={{ top: 0, left: 0, right: 0, height: rect.top }}
                onClick={onComplete}
              />
              <motion.div
                key="backdrop-bottom"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className={styles.backdrop}
                style={{ top: rect.bottom, left: 0, right: 0, height: `calc(100vh - ${rect.bottom}px)` }}
                onClick={onComplete}
              />
              <motion.div
                key="backdrop-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className={styles.backdrop}
                style={{ top: rect.top, left: 0, width: rect.left, height: rect.height }}
                onClick={onComplete}
              />
              <motion.div
                key="backdrop-right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className={styles.backdrop}
                style={{ top: rect.top, left: rect.right, right: 0, height: rect.height }}
                onClick={onComplete}
              />
            </>
          ) : (
            <motion.div
              key="backdrop-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={styles.backdrop}
              style={{ inset: 0 }}
              onClick={onComplete}
            />
          )}

          {/* Spotlight glow behind highlight */}
          {hasHighlight && rect && (
            <motion.div
              key="spotlight"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={styles.spotlight}
              style={{
                top: rect.top - 12,
                left: rect.left - 12,
                width: rect.width + 24,
                height: rect.height + 24,
              }}
            />
          )}

          {/* Highlight ring */}
          {hasHighlight && rect && (
            <motion.div
              key="highlight"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 24 }}
              className={styles.highlight}
              style={{
                top: rect.top - 4,
                left: rect.left - 4,
                width: rect.width + 8,
                height: rect.height + 8,
              }}
            />
          )}

          {/* Tooltip - positioned relative to highlighted element */}
          <motion.div
            key="tooltip"
            ref={tooltipRef}
            initial={{ opacity: 0, y: hasHighlight ? 8 : 16, scale: hasHighlight ? 0.97 : 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.08 }}
            style={{
              position: "fixed",
              pointerEvents: "auto",
              zIndex: 10000,
              left: tooltipPos.left,
              top: tooltipPos.top,
            }}
            className={styles.tooltipCard}
          >
            {/* Arrow */}
            {tooltipPos.arrow && (
              <div
                className={`${styles.arrow} ${styles[`arrow_${tooltipPos.arrow}`]}`}
                style={arrowStyle}
              />
            )}
            {tooltipContent}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
