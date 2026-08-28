/**
 * MeteVet Global Motion Design System — Shared IntersectionObserver
 *
 * Fires once when the element intersects the viewport, then disconnects.
 */

"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { VIEWPORT_AMOUNT, VIEWPORT_MARGIN } from "./motion-config";

interface UseInViewOnceOptions {
  rootMargin?: string;
  threshold?: number;
  /** When false, keeps observing (default true). */
  triggerOnce?: boolean;
  /** Skip observing entirely. */
  disabled?: boolean;
}

export function useInViewOnce<T extends HTMLElement = HTMLElement>(
  options: UseInViewOnceOptions = {},
): { ref: RefObject<T | null>; inView: boolean } {
  const {
    rootMargin = VIEWPORT_MARGIN,
    threshold = VIEWPORT_AMOUNT,
    triggerOnce = true,
    disabled = false,
  } = options;

  const [inView, setInView] = useState(false);
  const ref = useRef<T | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    if (triggerOnce && fired.current) return;

    // Environments without IntersectionObserver: treat as in-view via microtask
    // so we never call setState synchronously inside the effect body.
    if (typeof IntersectionObserver === "undefined") {
      let cancelled = false;
      queueMicrotask(() => {
        if (cancelled) return;
        setInView(true);
        fired.current = true;
      });
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setInView(true);
        fired.current = true;
        if (triggerOnce) observer.disconnect();
      },
      { rootMargin, threshold },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, triggerOnce, disabled]);

  return { ref, inView };
}
