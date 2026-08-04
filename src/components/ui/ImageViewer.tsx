"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn, ZoomOut, Maximize, Move } from "lucide-react";
import styles from "@/styles/components/ui/ImageViewer.module.css";

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".avif"];

/** Cek apakah URL mengarah ke file gambar. */
function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.includes(ext));
}

/**
 * ImageViewer — preview gambar kecil + lightbox fullscreen dengan zoom & geser.
 * Kalau bukan gambar, render link "Lihat/Layout file".
 */
export function ImageViewer({ src, alt = "Bukti" }: { src: string | null; alt?: string }) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);

  const isImage = !!src && isImageUrl(src);

  const resetView = () => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  };

  const openViewer = () => {
    resetView();
    setOpen(true);
  };

  const closeViewer = useCallback(() => {
    setOpen(false);
    resetView();
  }, []);

  const zoomIn = () => setScale((s) => Math.min(ZOOM_MAX, +(s + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(ZOOM_MIN, +(s - ZOOM_STEP).toFixed(2)));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") resetView();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!src) return null;

  // zoom dengan roda mouse
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    setScale((s) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +(s + delta).toFixed(2))));
  }

  const canPan = scale > 1;

  function onPointerDown(e: React.PointerEvent) {
    if (!canPan) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag({ startX: e.clientX, startY: e.clientY, x: pos.x, y: pos.y });
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    setPos({ x: drag.x + (e.clientX - drag.startX), y: drag.y + (e.clientY - drag.startY) });
  }
  function onPointerUp() {
    setDrag(null);
  }

  return (
    <>
      {isImage ? (
        <button
          type="button"
          onClick={openViewer}
          className={styles.thumbBtn}
          title="Klik untuk perbesar"
        >
          <img src={src} alt={alt} className={styles.thumb} />
          <span className={styles.thumbOverlay}>
            <ZoomIn className="h-4 w-4" />
            <span>Perbesar</span>
          </span>
        </button>
      ) : (
        <a href={src} target="_blank" rel="noreferrer" className={styles.fileLink}>
          Lihat file bukti
        </a>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onWheel={onWheel}
          >
            <button type="button" onClick={closeViewer} aria-label="Tutup" className={styles.closeBtn}>
              <X className="h-6 w-6" />
            </button>

            <div
              className={styles.canvas}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ cursor: canPan ? (drag ? "grabbing" : "grab") : "default" }}
            >
              <img
                src={src}
                alt={alt}
                draggable={false}
                className={styles.image}
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                }}
              />
            </div>

            <div className={styles.toolbar}>
              <button type="button" onClick={zoomOut} disabled={scale <= ZOOM_MIN} aria-label="Perkecil">
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
              <button type="button" onClick={zoomIn} disabled={scale >= ZOOM_MAX} aria-label="Perbesar">
                <ZoomIn className="h-5 w-5" />
              </button>
              <span className={styles.divider} />
              <button type="button" onClick={resetView} aria-label="Reset">
                <Maximize className="h-5 w-5" />
              </button>
              {canPan && (
                <>
                  <span className={styles.divider} />
                  <span className={styles.panHint}>
                    <Move className="h-4 w-4" /> Geser untuk pan
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}