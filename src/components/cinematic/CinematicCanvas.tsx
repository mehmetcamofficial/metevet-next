"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  CAT_GAZE,
  CAT_VISIBLE_RANGE,
  DAMPING_RESPONSE,
  DEPTH_AMPLITUDE,
  MAX_DPR,
  ZOOM_FACTOR,
} from "./cinematic.constants";

export type PointerState = { x: number; y: number; active: boolean };

type Props = {
  targetFrameRef: RefObject<number>;
  pointerRef: RefObject<PointerState>;
  active: boolean;
  getDrawableFrame: (index: number) => HTMLImageElement | null;
  maintainDecodeWindow: (index: number) => void;
};

/** Padding around the gaze region so rotation never exposes the sampled edge. */
const GAZE_PAD = 1.35;

function buildMask(size: number, radius: number, feather: number): HTMLCanvasElement {
  const mask = document.createElement("canvas");
  mask.width = size;
  mask.height = size;
  const ctx = mask.getContext("2d");
  if (ctx) {
    const centre = size / 2;
    const gradient = ctx.createRadialGradient(
      centre,
      centre,
      Math.max(0, radius * (1 - feather)),
      centre,
      centre,
      radius,
    );
    gradient.addColorStop(0, "rgba(0,0,0,1)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return mask;
}

/** Ramps the gaze effect in and out at the edges of the cat's shot. */
function gazeStrength(frame: number): number {
  const { from, to } = CAT_VISIBLE_RANGE;
  if (frame <= from || frame >= to) return 0;
  const fade = 6;
  return Math.min(1, Math.min(frame - from, to - frame) / fade);
}

export function CinematicCanvas({
  targetFrameRef,
  pointerRef,
  active,
  getDrawableFrame,
  maintainDecodeWindow,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentFrameRef = useRef(0);
  const gazeRef = useRef({ x: 0, y: 0 });
  const driftRef = useRef({ x: 0, y: 0 });
  const layoutRef = useRef({ width: 0, height: 0, dpr: 1 });
  const dirtyRef = useRef(true);

  const gazeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gazeSizeRef = useRef(0);

  // Size the backing store only when the element actually changes size.
  // The previous implementation reassigned canvas.width on every painted
  // frame, which reallocates the surface sixty times a second.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);
      if (canvas.width === width && canvas.height === height) return;

      canvas.width = width;
      canvas.height = height;
      layoutRef.current = { width: rect.width, height: rect.height, dpr };
      dirtyRef.current = true;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("orientationchange", resize);

    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", resize);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf: number | null = null;
    let previous: number | null = null;
    let stopped = false;

    const paint = (timestamp: number) => {
      if (stopped || document.hidden) return;
      const deltaSeconds = Math.min((timestamp - (previous ?? timestamp)) / 1000, 0.05);
      previous = timestamp;
      const alpha = 1 - Math.exp(-DAMPING_RESPONSE * deltaSeconds);

      const target = targetFrameRef.current ?? 0;
      const frameDelta = target - currentFrameRef.current;
      if (Math.abs(frameDelta) < 0.01) {
        currentFrameRef.current = target;
      } else {
        currentFrameRef.current += frameDelta * alpha;
        dirtyRef.current = true;
      }

      const pointer = pointerRef.current ?? { x: 0, y: 0, active: false };
      const gazeAlpha = 1 - Math.exp(-CAT_GAZE.damping * deltaSeconds);
      const wantX = pointer.active ? pointer.x : 0;
      const wantY = pointer.active ? pointer.y : 0;

      const gaze = gazeRef.current;
      const drift = driftRef.current;
      const beforeX = gaze.x;
      const beforeY = gaze.y;
      gaze.x += (wantX - gaze.x) * gazeAlpha;
      gaze.y += (wantY - gaze.y) * gazeAlpha;
      drift.x += (wantX - drift.x) * alpha;
      drift.y += (wantY - drift.y) * alpha;
      if (Math.abs(gaze.x - beforeX) > 0.0005 || Math.abs(gaze.y - beforeY) > 0.0005) {
        dirtyRef.current = true;
      }

      // Stays dirty until a frame actually lands on the canvas, so an early
      // scroll before any image has loaded still paints once one arrives.
      if (dirtyRef.current && draw(ctx)) dirtyRef.current = false;

      raf = window.requestAnimationFrame(paint);
    };

    const draw = (context: CanvasRenderingContext2D): boolean => {
      const { width, height, dpr } = layoutRef.current;
      if (width === 0 || height === 0) return false;

      const frame = currentFrameRef.current;
      const img = getDrawableFrame(frame);
      if (!img) return false;
      maintainDecodeWindow(frame);

      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const imgAspect = img.width / img.height;
      const boxAspect = width / height;
      let drawWidth: number;
      let drawHeight: number;
      if (imgAspect > boxAspect) {
        drawHeight = height * ZOOM_FACTOR;
        drawWidth = drawHeight * imgAspect;
      } else {
        drawWidth = width * ZOOM_FACTOR;
        drawHeight = drawWidth / imgAspect;
      }

      // Background plane drifts least — the sense of depth comes from the
      // difference between this and the cat's own offset below.
      const drift = driftRef.current;
      const drawX = (width - drawWidth) / 2 + drift.x * DEPTH_AMPLITUDE.background;
      const drawY = (height - drawHeight) / 2 + drift.y * DEPTH_AMPLITUDE.background;

      context.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      const strength = gazeStrength(frame);
      if (strength > 0) {
        drawGaze(context, img, drawX, drawY, drawWidth, dpr, strength);
      }
      return true;
    };

    const drawGaze = (
      context: CanvasRenderingContext2D,
      img: HTMLImageElement,
      drawX: number,
      drawY: number,
      drawWidth: number,
      dpr: number,
      strength: number,
    ) => {
      const scale = drawWidth / img.width;
      const drawHeight = img.height * scale;
      const radiusCss = CAT_GAZE.radius * drawWidth;
      const padRadiusCss = radiusCss * GAZE_PAD;
      const sizeCss = padRadiusCss * 2;
      const sizeDev = Math.max(16, Math.ceil(sizeCss * dpr));

      if (gazeSizeRef.current !== sizeDev) {
        gazeSizeRef.current = sizeDev;
        const surface = document.createElement("canvas");
        surface.width = sizeDev;
        surface.height = sizeDev;
        gazeCanvasRef.current = surface;
        maskCanvasRef.current = buildMask(
          sizeDev,
          radiusCss * dpr,
          CAT_GAZE.feather,
        );
      }

      const surface = gazeCanvasRef.current;
      const mask = maskCanvasRef.current;
      if (!surface || !mask) return;
      const gctx = surface.getContext("2d");
      if (!gctx) return;

      const gaze = gazeRef.current;
      // The cat's own offset is the difference between the foreground
      // amplitude and the background drift already applied to the plate.
      const differential = DEPTH_AMPLITUDE.foreground - DEPTH_AMPLITUDE.background;
      const tx = gaze.x * Math.min(CAT_GAZE.maxTranslatePx, differential) * strength;
      const ty = gaze.y * Math.min(CAT_GAZE.maxTranslatePx, differential) * strength * 0.7;
      const rotate = gaze.x * CAT_GAZE.maxRotateRad * strength;

      const k = sizeDev / sizeCss;
      gctx.setTransform(1, 0, 0, 1, 0, 0);
      gctx.clearRect(0, 0, sizeDev, sizeDev);
      gctx.setTransform(k, 0, 0, k, 0, 0);

      const sourceRadius = padRadiusCss / scale;
      const sourceCx = CAT_GAZE.anchorX * img.width;
      const sourceCy = CAT_GAZE.anchorY * img.height;

      gctx.translate(padRadiusCss, padRadiusCss);
      gctx.rotate(rotate);
      gctx.translate(tx, ty);
      gctx.drawImage(
        img,
        sourceCx - sourceRadius,
        sourceCy - sourceRadius,
        sourceRadius * 2,
        sourceRadius * 2,
        -padRadiusCss,
        -padRadiusCss,
        sizeCss,
        sizeCss,
      );

      gctx.setTransform(1, 0, 0, 1, 0, 0);
      gctx.globalCompositeOperation = "destination-in";
      gctx.drawImage(mask, 0, 0);
      gctx.globalCompositeOperation = "source-over";

      const destCx = drawX + CAT_GAZE.anchorX * drawWidth;
      const destCy = drawY + CAT_GAZE.anchorY * drawHeight;
      context.drawImage(
        surface,
        destCx - padRadiusCss,
        destCy - padRadiusCss,
        sizeCss,
        sizeCss,
      );
    };

    dirtyRef.current = true;
    raf = window.requestAnimationFrame(paint);

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopped = true;
        if (raf !== null) window.cancelAnimationFrame(raf);
        raf = null;
      } else {
        stopped = false;
        previous = null;
        raf = window.requestAnimationFrame(paint);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (raf !== null) window.cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [active, getDrawableFrame, maintainDecodeWindow, pointerRef, targetFrameRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}
