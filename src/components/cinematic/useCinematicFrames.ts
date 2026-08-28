"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CINEMATIC_SEGMENTS,
  FRAME_SEARCH_RADIUS,
  LAST_USABLE_FRAME,
  PRELOAD_CONCURRENCY,
  TIER_STRIDE,
  buildPriorityLadder,
  frameUrl,
  type CinematicTier,
} from "./cinematic.constants";

/**
 * Frames decoded either side of the playhead.
 *
 * Every planned frame is fetched, but only this window is explicitly decoded.
 * Decoding all 179 frames at 1600x894 would pin roughly a gigabyte of RGBA
 * surfaces; a window keeps it to a couple of hundred megabytes while still
 * guaranteeing the frames about to be scrubbed through are jank-free.
 */
const DECODE_AHEAD = 16;
const DECODE_BEHIND = 10;

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const images = imagesRef.current;
    const loaded = loadedRef.current;
    const decoded = decodedRef.current;
    const planned = planFrames(tier);
    plannedRef.current = planned;

    let cancelled = false;
    let failures = 0;

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

    const runPool = async (indices: number[]) => {
      let cursor = 0;
      const workers = Array.from(
        { length: Math.min(PRELOAD_CONCURRENCY, indices.length) },
        async () => {
          while (!cancelled && cursor < indices.length) {
            await load(indices[cursor++]);
          }
        },
      );
      await Promise.all(workers);
    };

    const plannedSet = new Set(planned);
    const ladder = buildPriorityLadder().filter((i) => plannedSet.has(i));
    const ladderSet = new Set(ladder);
    const remainder = planned.filter((i) => !ladderSet.has(i));

    void (async () => {
      await load(0);
      if (cancelled) return;
      // Decode the opening frame before revealing so the first paint is clean.
      const first = images.get(0);
      if (first?.decode) await first.decode().catch(() => {});
      if (cancelled) return;
      decoded.add(0);
      setReady(true);

      await runPool(ladder.filter((i) => i !== 0));
      if (cancelled) return;
      setScrubReady(true);

      await runPool(remainder);
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
    };
  }, [tier]);

  const getDrawableFrame = useCallback((index: number): HTMLImageElement | null => {
    const images = imagesRef.current;
    const loaded = loadedRef.current;
    const target = Math.max(0, Math.min(LAST_USABLE_FRAME, Math.round(index)));

    if (loaded.has(target)) return images.get(target) ?? null;

    for (let radius = 1; radius <= FRAME_SEARCH_RADIUS; radius++) {
      const lower = target - radius;
      const upper = target + radius;
      if (lower >= 0 && loaded.has(lower)) return images.get(lower) ?? null;
      if (upper <= LAST_USABLE_FRAME && loaded.has(upper)) return images.get(upper) ?? null;
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
    return best === null ? null : (images.get(best) ?? null);
  }, []);

  const maintainDecodeWindow = useCallback((index: number) => {
    const images = imagesRef.current;
    const loaded = loadedRef.current;
    const decoded = decodedRef.current;
    const centre = Math.round(index);

    for (let i = centre - DECODE_BEHIND; i <= centre + DECODE_AHEAD; i++) {
      if (i < 0 || i > LAST_USABLE_FRAME) continue;
      if (decoded.has(i) || !loaded.has(i)) continue;
      const img = images.get(i);
      if (!img?.decode) continue;
      decoded.add(i);
      img.decode().catch(() => {
        decoded.delete(i);
      });
    }
  }, []);

  return { ready, scrubReady, failed, getDrawableFrame, maintainDecodeWindow };
}
