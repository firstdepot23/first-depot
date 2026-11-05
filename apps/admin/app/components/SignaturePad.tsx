"use client";

import { useCallback, useEffect, useRef } from "react";
import { Eraser } from "lucide-react";

const INK = "#1e3a8a"; // blue-900, so it reads as a pen signature on the PDF
const SCRIPT_FONT =
  '"Segoe Script","Brush Script MT","Snell Roundhand","Apple Chancery",cursive';

// Crops transparent margins, so the signature fills the space it is given in
// the PDF instead of shrinking to fit a mostly empty canvas.
const exportTrimmed = (canvas: HTMLCanvasElement, pad = 8): string | null => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Alpha channel; `?? 0` keeps strict "noUncheckedIndexedAccess" happy.
      if ((data[(y * width + x) * 4 + 3] ?? 0) > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null; // nothing drawn

  const sx = Math.max(0, minX - pad);
  const sy = Math.max(0, minY - pad);
  const sw = Math.min(width, maxX + pad) - sx;
  const sh = Math.min(height, maxY + pad) - sy;

  const out = document.createElement("canvas");
  out.width = sw;
  out.height = sh;
  out.getContext("2d")?.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return out.toDataURL("image/png");
};

/** Renders a typed name in a handwriting font as a transparent PNG data URL. */
export const typedSignaturePng = (name: string): string | null => {
  const text = name.trim();
  if (!text) return null;

  const fontSize = 72;
  const font = `italic ${fontSize}px ${SCRIPT_FONT}`;

  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return null;
  probe.font = font;
  const textWidth = Math.ceil(probe.measureText(text).width);

  const canvas = document.createElement("canvas");
  canvas.width = textWidth + 40;
  canvas.height = Math.round(fontSize * 1.8);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.font = font;
  ctx.fillStyle = INK;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 20, canvas.height / 2);
  return exportTrimmed(canvas, 6);
};

type Props = {
  /** Called after every stroke with a PNG data URL, or null when cleared. */
  onChange: (dataUrl: string | null) => void;
  /** A saved signature to show (used to fill the pad, never overwrites ink). */
  initial?: string | null;
};

const SignaturePad = ({ onChange, initial = null }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hasInk = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });

  const ctxOf = () => canvasRef.current?.getContext("2d") ?? null;

  const paintImage = useCallback((src: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const img = new Image();
    img.onload = () => {
      // Fit the image inside the pad, centred, keeping its proportions.
      const scale = Math.min(
        (canvas.width * 0.9) / img.width,
        (canvas.height * 0.9) / img.height,
        1,
      );
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      hasInk.current = true;
    };
    img.src = src;
  }, []);

  // Size the canvas to its box (sharp on high-density screens). If the box
  // changes width (rotating a phone), keep what was drawn.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(wrap.clientWidth * dpr);
      const h = Math.round(wrap.clientHeight * dpr);
      if (!w || !h || (w === sizeRef.current.w && h === sizeRef.current.h))
        return;

      const snapshot = hasInk.current ? canvas.toDataURL("image/png") : null;
      canvas.width = w;
      canvas.height = h;
      sizeRef.current = { w, h };
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.6 * dpr;
      }
      if (snapshot) paintImage(snapshot);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [paintImage]);

  // Show a saved signature, but only while the pad is still empty.
  useEffect(() => {
    if (initial && !hasInk.current) paintImage(initial);
  }, [initial, paintImage]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = ctxOf();
    if (!ctx) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = point(e);
    last.current = p;
    // A tap leaves a dot.
    ctx.beginPath();
    ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
    hasInk.current = true;
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const ctx = ctxOf();
    if (!ctx) return;
    const p = point(e);
    const mid = {
      x: (last.current.x + p.x) / 2,
      y: (last.current.y + p.y) / 2,
    };
    // Curve through midpoints so handwriting looks smooth, not jagged.
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const canvas = canvasRef.current;
    if (canvas) onChange(exportTrimmed(canvas));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = ctxOf();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div
        ref={wrapRef}
        className="relative h-36 w-full overflow-hidden rounded-md border border-dashed bg-white"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-crosshair"
          // Stops the page scrolling while signing on a touch screen.
          style={{ touchAction: "none" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
          aria-label="Signature drawing area"
        />
        <span className="pointer-events-none absolute bottom-6 left-4 right-4 border-b border-gray-300" />
        <span className="pointer-events-none absolute bottom-1.5 left-4 text-[10px] uppercase tracking-wide text-gray-400">
          Sign above the line
        </span>
      </div>
      <button
        type="button"
        onClick={clear}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <Eraser className="size-3.5" />
        Clear
      </button>
    </div>
  );
};

export default SignaturePad;
