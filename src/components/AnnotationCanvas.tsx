"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { Canvas as FabricCanvas } from "fabric";

interface Props {
  width: number;
  height: number;
  onSave: (imageData: string) => void;
  pdfBackgroundUrl?: string | null;
}

type Tool = "select" | "pen" | "text" | "arrow" | "rect" | "circle";

export function AnnotationCanvas({ width, height, onSave, pdfBackgroundUrl }: Props) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState("#E53E3E");
  const [lineWidth, setLineWidth] = useState(2);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current || !canvasEl.current) return;
    initDone.current = true;
    (async () => {
      const fabric = await import("fabric");
      const { Canvas } = fabric;
      const fc = new Canvas(canvasEl.current!, {
        width,
        height,
        backgroundColor: "#ffffff",
        selection: true,
        preserveObjectStacking: true,
      });
      fabricRef.current = fc;
      saveState(fc);
    })();
  }, [width, height]);

  const setBg = useCallback(async (url: string | null | undefined) => {
    const fc = fabricRef.current;
    if (!fc) return;
    if (!url) {
      fc.backgroundImage = undefined;
      fc.renderAll();
      return;
    }
    const fabric = await import("fabric");
    try {
      const img = await fabric.Image.fromURL(url, { crossOrigin: "anonymous" });
      const sx = fc.width! / img.width!;
      const sy = fc.height! / img.height!;
      img.set({ scaleX: sx, scaleY: sy });
      fc.backgroundImage = img;
      fc.renderAll();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (pdfBackgroundUrl) {
      setBg(pdfBackgroundUrl);
    } else {
      setBg(null);
    }
  }, [pdfBackgroundUrl, setBg]);

  const saveState = useCallback((fc?: FabricCanvas) => {
    const c = fc || fabricRef.current;
    if (!c) return;
    const json = JSON.stringify(c.toJSON());
    setHistory((prev) => {
      const next = prev.slice(0, historyIdx + 1);
      next.push(json);
      return next;
    });
    setHistoryIdx((prev) => prev + 1);
  }, [historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx <= 0) return;
    const fc = fabricRef.current;
    if (!fc) return;
    const newIdx = historyIdx - 1;
    fc.loadFromJSON(history[newIdx]).then(() => {
      fc.renderAll();
      setHistoryIdx(newIdx);
    });
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const fc = fabricRef.current;
    if (!fc) return;
    const newIdx = historyIdx + 1;
    fc.loadFromJSON(history[newIdx]).then(() => {
      fc.renderAll();
      setHistoryIdx(newIdx);
    });
  }, [history, historyIdx]);

  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    fc.isDrawingMode = tool === "pen";
    if (tool === "pen" && fc.freeDrawingBrush) {
      fc.freeDrawingBrush.color = color;
      fc.freeDrawingBrush.width = lineWidth;
    }

    fc.selection = tool === "select";
    fc.defaultCursor = tool === "select" ? "default" : "crosshair";

    const handleMouseDown = async (opt: any) => {
      if (tool === "select" || tool === "pen") return;
      const fabric = await import("fabric");
      const { Rect, Ellipse, IText, Line, ActiveSelection } = fabric;
      const pointer = opt.viewportPoint || opt.scenePoint || { x: 0, y: 0 };
      let objs: any[] = [];

      switch (tool) {
        case "text": {
          const txt = new IText("Teks", {
            left: pointer.x,
            top: pointer.y,
            fontSize: 16,
            fill: color,
            fontFamily: "Arial",
            editable: true,
          });
          objs = [txt];
          break;
        }
        case "arrow": {
          const dx = 60;
          const dy = -60;
          const line = new Line([pointer.x, pointer.y, pointer.x + dx, pointer.y + dy], {
            stroke: color,
            strokeWidth: 2,
          });
          const a = Math.atan2(dy, dx);
          const hl = 12;
          const ex = pointer.x + dx;
          const ey = pointer.y + dy;
          const h1 = new Line([ex, ey, ex - hl * Math.cos(a - Math.PI / 6), ey - hl * Math.sin(a - Math.PI / 6)], {
            stroke: color, strokeWidth: 2,
          });
          const h2 = new Line([ex, ey, ex - hl * Math.cos(a + Math.PI / 6), ey - hl * Math.sin(a + Math.PI / 6)], {
            stroke: color, strokeWidth: 2,
          });
          objs = [line, h1, h2];
          break;
        }
        case "rect": {
          const rect = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 100,
            height: 80,
            fill: "transparent",
            stroke: color,
            strokeWidth: 2,
          });
          objs = [rect];
          break;
        }
        case "circle": {
          const circ = new Ellipse({
            left: pointer.x,
            top: pointer.y,
            rx: 50,
            ry: 40,
            fill: "transparent",
            stroke: color,
            strokeWidth: 2,
          });
          objs = [circ];
          break;
        }
      }

      if (objs.length > 0) {
        const group = objs.length > 1 ? new ActiveSelection(objs, { canvas: fc }) : objs[0];
        objs.forEach((o) => fc.add(o));
        fc.setActiveObject(group);
        fc.requestRenderAll();
        saveState(fc);
      }
    };

    fc.on("mouse:down", handleMouseDown);
    fc.on("path:created", () => saveState(fc));
    fc.on("object:modified", () => saveState(fc));

    return () => {
      fc.off("mouse:down", handleMouseDown as any);
      fc.off("path:created");
      fc.off("object:modified");
    };
  }, [tool, color, lineWidth, saveState]);

  const handleSave = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    onSave(fc.toDataURL({ format: "png", multiplier: 1 }));
  };

  const handleClear = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.clear();
    fc.backgroundColor = "#ffffff";
    fc.backgroundImage = undefined;
    fc.renderAll();
    saveState(fc);
  };

  const handleDelete = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObjects();
    if (active.length > 0) {
      active.forEach((obj) => fc.remove(obj));
      fc.discardActiveObject();
      fc.requestRenderAll();
      saveState(fc);
    }
  };

  const tools: { key: Tool; label: string }[] = [
    { key: "select", label: "Pilih" },
    { key: "pen", label: "Pena" },
    { key: "text", label: "Teks" },
    { key: "arrow", label: "Panah" },
    { key: "rect", label: "Kotak" },
    { key: "circle", label: "Lingkaran" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 p-2 bg-slate-800 rounded-lg flex-wrap">
        {tools.map((t) => (
          <button key={t.key} onClick={() => setTool(t.key)}
            className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${tool === t.key ? "bg-white text-slate-800" : "bg-slate-600 text-white hover:bg-slate-500"}`}
          >
            {t.label}
          </button>
        ))}
        <div className="w-px h-5 bg-slate-600 mx-1" />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
          className="w-6 h-6 rounded border-0 cursor-pointer p-0" />
        <select value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))}
          className="text-xs px-1 py-0.5 rounded bg-slate-600 text-white border-0">
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={4}>4</option>
          <option value={6}>6</option>
        </select>
        <div className="w-px h-5 bg-slate-600 mx-1" />
        <button onClick={undo} disabled={historyIdx <= 0}
          className="text-xs px-2 py-1 rounded bg-slate-600 text-white hover:bg-slate-500 disabled:opacity-40 transition-colors">
          Undo
        </button>
        <button onClick={redo} disabled={historyIdx >= history.length - 1}
          className="text-xs px-2 py-1 rounded bg-slate-600 text-white hover:bg-slate-500 disabled:opacity-40 transition-colors">
          Redo
        </button>
        <button onClick={handleDelete}
          className="text-xs px-2 py-1 rounded bg-slate-600 text-white hover:bg-slate-500 transition-colors">
          Hapus
        </button>
        <div className="flex-1" />
        <button onClick={handleClear}
          className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors">
          Bersihkan
        </button>
        <button onClick={handleSave}
          className="text-xs px-3 py-1 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
          Simpan
        </button>
      </div>
      <canvas
        ref={canvasEl}
        width={width}
        height={height}
        className="border border-slate-300 rounded-lg bg-white"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </div>
  );
}