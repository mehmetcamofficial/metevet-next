"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CINEMATIC_SEGMENTS,
  FRAME_SEARCH_RADIUS,
  LAST_USABLE_FRAME,
  PRELOAD_CONCURRENCY,
  TIER_FRAME_CACHE_LIMIT,
  TIER_STRIDE,
  buildPriorityLadder,
  frameUrl,
  getCinematicFrameWindow,
  type CinematicTier,
} from "./cinematic.constants";

/**
 * Frames decoded either side of the playhead.
 *
 * Frames are fetched and decoded in a bounded playhead window. Decoding all
 * 179 frames at 1600x894 would pin roughly a gigabyte of RGBA surfaces; the
 * cache keeps only the frames most likely to be shown next.
 */
export type CinematicFrames = {
  /** First frame is painted — the hero can be shown. */
  ready: boolean;
  /** Coarse ladder is in, so scrubbing anywhere is approximately correct. */
  scrubReady: boolean;
  failed: boolean;
  /** Nearest frame that has finished loading, or null. */
  getDrawableFrame: (index: number) => HTMLImageElement | null;
  /** Keeps the decode window centred on the playhead. Cheap to call often. */
  maintainDecodeWindow: (index: number) => void;
};

function planFrames(tier: CinematicTier): number[] {
  const stride = TIER_STRIDE[tier];
  if (stride <= 0) return [0];

  const planned = new Set<number>();
  for (let i = 0; i <= LAST_USABLE_FRAME; i += stride) planned.add(i);
  // Segment edges must survive decimation or the retimed cuts land off-shot.
  for (const segment of CINEMATIC_SEGMENTS) {
    planned.add(segment.from);
    planned.add(segment.to);
  }
  planned.add(LAST_USABLE_FRAME);
  return [...planned].sort((a, b) => a - b);
}

export function useCinematicFrames(tier: CinematicTier): CinematicFrames {
  const [ready, setReady] = useState(false);
  const [scrubReady, setScrubReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const loadedRef = useRef<Set<number>>(new Set());
  const decodedRef = useRef<Set<number>>(new Set());
  const plannedRef = useRef<number[]>([]);
  const touchedRef = useRef<Map<number, number>>(new Map());
  const requestFramesRef = useRef<(indices: readonly number[]) => void>(() => {});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const images = imagesRef.current;
    const loaded = loadedRef.current;
    const decoded = decodedRef.current;
    const touched = touchedRef.current;
    const planned = planFrames(tier);
    plannedRef.current = planned;
    const plannedSet = new Set(planned);

    let cancelled = false;
    let failures = 0;
    let queue: number[] = [];
    let inFlight = 0;
    const queued = new Set<number>();

    const load = (index: number) =>
      new Promise<void>((resolve) => {
        if (cancelled || images.has(index)) return resolve();

        const img = new Image();
        img.decoding = "async";
        img.src = frameUrl(index);
        images.set(index, img);

        img.onload = () => {
          if (cancelled) return resolve();
          loaded.add(index);
          resolve();
        };
        img.onerror = () => {
          if (cancelled) return resolve();
          images.delete(index);
          failures += 1;
          // The sequence degrades gracefully around gaps; only a broad
          // failure means the network or the asset directory is gone.
          if (failures > planned.length * 0.25) setFailed(true);
          resolve();
        };
      });

    const pump = () => {
      while (!cancelled && inFlight < PRELOAD_CONCURRENCY && queue.length > 0) {
        const index = queue.shift();
        if (index === undefined) continue;
        queued.delete(index);
        inFlight += 1;
        void load(index).finally(() => {
          inFlight -= 1;
          pump();
        });
      }
    };

    const requestFrames = (indices: readonly number[]) => {
      for (const index of indices) {
        if (!plannedSet.has(index) || images.has(index) || queued.has(index)) continue;
        queued.add(index);
        queue.push(index);
      }
      pump();
    };
    requestFramesRef.current = requestFrames;

    void (async () => {
      await load(0);
      if (cancelled) return;
      // Decode the opening frame before revealing so the first paint is clean.
      const first = images.get(0);
      if (first?.decode) await first.decode().catch(() => {});
      if (cancelled) return;
      decoded.add(0);
      touched.set(0, performance.now());
      setReady(true);

      // Fetch only a small opening window plus a sparse navigation ladder.
      // Later frames are scheduled as the playhead approaches them.
      const ladder = buildPriorityLadder().filter((index) => plannedSet.has(index));
      requestFrames([...getCinematicFrameWindow(0, tier), ...ladder]);
      setScrubReady(true);
    })();

    return () => {
      cancelled = true;
      for (const img of images.values()) {
        img.onload = null;
        img.onerror = null;
        img.src = "";
      }
      images.clear();
      loaded.clear();
      decoded.clear();
      touched.clear();
      queue = [];
      queued.clear();
      requestFramesRef.current = () => {};
    };
  }, [tier]);

  const getDrawableFrame = useCallback((index: number): HTMLImageElement | null => {
    const images = imagesRef.current;
    const loaded = loadedRef.current;
    const target = Math.max(0, Math.min(LAST_USABLE_FRAME, Math.round(index)));

    if (loaded.has(target)) {
      touchedRef.current.set(target, performance.now());
      return images.get(target) ?? null;
    }

    for (let radius = 1; radius <= FRAME_SEARCH_RADIUS; radius++) {
      const lower = target - radius;
      const upper = target + radius;
      if (lower >= 0 && loaded.has(lower)) {
        touchedRef.current.set(lower, performance.now());
        return images.get(lower) ?? null;
      }
      if (upper <= LAST_USABLE_FRAME && loaded.has(upper)) {
        touchedRef.current.set(upper, performance.now());
        return images.get(upper) ?? null;
      }
    }

    // Never return null once anything has loaded — a blank canvas is worse
    // than a distant frame. Happens when the page restores deep into the
    // sequence before the ladder has filled in.
    let best: number | null = null;
    let bestDistance = Infinity;
    for (const index of loaded) {
      const distance = Math.abs(index - target);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    }
    if (best !== null) touchedRef.current.set(best, performance.now());
    return best === null ? null : (images.get(best) ?? null);
  }, []);

  const maintainDecodeWindow = useCallback((index: number) => {
    const images = imagesRef.current;
    const loaded = loadedRef.current;
    const decoded = decodedRef.current;
    const windowFrames = getCinematicFrameWindow(index, tier);
    const protectedFrames = new Set(windowFrames);
    requestFramesRef.current(windowFrames);

    for (const i of windowFrames) {
      if (decoded.has(i) || !loaded.has(i)) continue;
      const img = images.get(i);
      if (!img?.decode) continue;
      decoded.add(i);
      img.decode().catch(() => {
        decoded.delete(i);
      });
    }
    const candidates = [...images.keys()]
      .filter((frame) => loaded.has(frame) && !protectedFrames.has(frame))
      .sort((left, right) => (touchedRef.current.get(left) ?? 0) - (touchedRef.current.get(right) ?? 0));
    while (images.size > TIER_FRAME_CACHE_LIMIT[tier] && candidates.length > 0) {
      const frame = candidates.shift();
      if (frame === undefined) break;
      const image = images.get(frame);
      if (!image) continue;
      image.onload = null;
      image.onerror = null;
      image.src = "";
      images.delete(frame);
      loaded.delete(frame);
      decoded.delete(frame);
      touchedRef.current.delete(frame);
    }
  }, [tier]);

  return { ready, scrubReady, failed, getDrawableFrame, maintainDecodeWindow };
}
