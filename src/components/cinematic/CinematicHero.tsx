"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import NextImage from "next/image";
import { getDictionary } from "@/src/lib/i18n";
import { getRoutePath } from "@/src/lib/routes";
import { siteConfig } from "@/src/data/site";
import type { Locale } from "@/types";
import { PhoneCall, Sparkles, ChevronDown } from "lucide-react";
import { ButtonLink } from "@/src/components/ui/button-link";

const TOTAL_FRAMES = 180;
const ZOOM_FACTOR = 1.18;
const MAX_DPR = 2;
const INDICATOR_FADE_THRESHOLD = 0.1;
const EXIT_CUE_THRESHOLD = 0.9;
const PRELOAD_CONCURRENCY = 8;
const DAMPING_RESPONSE = 14;
const FRAME_SEARCH_RADIUS = 10;
const SCROLL_ANIMATION_DURATION = 650;

function clampScrollTarget(targetY: number): number {
  const maxScroll = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight
  );
  return Math.max(0, Math.min(targetY, maxScroll));
}

export function CinematicHero({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const decodedRef = useRef<Set<number>>(new Set());
  const rafRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const targetFrameRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const previousTimestampRef = useRef<number | null>(null);

  // Find nearest decoded frame
  const findNearestDecodedFrame = useCallback((requested: number): number | null => {
    if (decodedRef.current.has(requested)) {
      return requested;
    }

    for (let radius = 1; radius <= FRAME_SEARCH_RADIUS; radius++) {
      const lower = requested - radius;
      const upper = requested + radius;

      if (lower >= 0 && decodedRef.current.has(lower)) {
        return lower;
      }
      if (upper < TOTAL_FRAMES && decodedRef.current.has(upper)) {
        return upper;
      }
    }

    return null;
  }, []);

  // Draw frame to canvas
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imagesRef.current[frameIndex];
    if (!img) return;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const imgAspect = img.width / img.height;
    const canvasAspect = rect.width / rect.height;

    let drawWidth: number;
    let drawHeight: number;
    let drawX: number;
    let drawY: number;

    if (imgAspect > canvasAspect) {
      drawHeight = rect.height * ZOOM_FACTOR;
      drawWidth = drawHeight * imgAspect;
      drawX = (rect.width - drawWidth) / 2;
      drawY = (rect.height - drawHeight) / 2;
    } else {
      drawWidth = rect.width * ZOOM_FACTOR;
      drawHeight = drawWidth / imgAspect;
      drawX = (rect.width - drawWidth) / 2;
      drawY = (rect.height - drawHeight) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }, []);

  // Animation loop with time-based damping.
  // rafRef is the single source of truth for whether the loop is running.
  const startAnimation = useCallback(() => {
    if (rafRef.current !== null) return;
    previousTimestampRef.current = null;
    if (process.env.NODE_ENV === "development") {
      console.debug("[CinematicHero] frame RAF started", {
        current: currentFrameRef.current,
        target: targetFrameRef.current,
      });
    }

    const animate = (timestamp: number) => {
      const target = targetFrameRef.current;
      const current = currentFrameRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.01) {
        currentFrameRef.current = target;
        const finalFrame = Math.round(target);
        const nearestDecoded = findNearestDecodedFrame(finalFrame);
        if (nearestDecoded !== null) {
          drawFrame(nearestDecoded);
        }
        if (process.env.NODE_ENV === "development") {
          console.debug("[CinematicHero] frame RAF stopped");
        }
        rafRef.current = null;
        previousTimestampRef.current = null;
        return;
      }

      const previousTime = previousTimestampRef.current ?? timestamp;
      const deltaSeconds = Math.min((timestamp - previousTime) / 1000, 0.05);
      previousTimestampRef.current = timestamp;

      const alpha = 1 - Math.exp(-DAMPING_RESPONSE * deltaSeconds);
      const newCurrent = current + diff * alpha;
      currentFrameRef.current = newCurrent;

      const displayFrame = Math.round(newCurrent);
      const nearestDecoded = findNearestDecodedFrame(displayFrame);
      if (nearestDecoded !== null) {
        drawFrame(nearestDecoded);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [drawFrame, findNearestDecodedFrame]);

  // Internal window scroll helper (no scroll plugin)
  const animateWindowScroll = useCallback((targetY: number, duration = SCROLL_ANIMATION_DURATION) => {
    const clampedTarget = clampScrollTarget(targetY);
    const startY = window.scrollY;
    const distance = clampedTarget - startY;
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      window.scrollTo(0, startY + distance * easeOutCubic(progress));

      if (progress < 1) {
        scrollRafRef.current = requestAnimationFrame(step);
      } else {
        scrollRafRef.current = null;
      }
    };

    if (scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }

    scrollRafRef.current = requestAnimationFrame(step);
  }, []);

  // Prioritized frame preloading with decode and bounded concurrency
  useEffect(() => {
    if (typeof window === "undefined") return;

    const images: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES);
    const decoded = decodedRef.current;
    let decodedCount = 0;
    let failedCount = 0;
    let settledCount = 0;

    const markSettled = () => {
      settledCount++;
      if (settledCount === TOTAL_FRAMES) {
        if (failedCount > TOTAL_FRAMES * 0.1) {
          setFailed(true);
        } else {
          setLoaded(true);
        }

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[CinematicHero] Loaded ${decodedCount}/${TOTAL_FRAMES} frames (${failedCount} failed)`
          );
        }
      }
    };

    const markDecoded = () => {
      decodedCount++;
      setProgress((decodedCount / TOTAL_FRAMES) * 100);
    };

    const markFailed = () => {
      failedCount++;
    };

    const loadImage = (frameIndex: number): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = `/images/cinematic-smooth/frame-${String(frameIndex + 1).padStart(3, "0")}.jpg`;

        img.onload = () => {
          images[frameIndex] = img;

          if (typeof img.decode === "function") {
            img.decode().then(() => {
              decoded.add(frameIndex);
              markDecoded();
              markSettled();
              resolve();
            }).catch(() => {
              decoded.add(frameIndex);
              markDecoded();
              markSettled();
              resolve();
            });
          } else {
            decoded.add(frameIndex);
            markDecoded();
            markSettled();
            resolve();
          }
        };

        img.onerror = () => {
          images[frameIndex] = null;
          markFailed();
          markSettled();
          resolve();
        };
      });
    };

    const loadBatch = async (indices: number[]) => {
      const queue = [...indices];
      const active: Promise<void>[] = [];

      while (queue.length > 0 || active.length > 0) {
        while (active.length < PRELOAD_CONCURRENCY && queue.length > 0) {
          const index = queue.shift()!;
          const promise = loadImage(index).then(() => {
            const idx = active.indexOf(promise);
            if (idx > -1) active.splice(idx, 1);
          });
          active.push(promise);
        }
        await Promise.race(active);
      }
    };

    imagesRef.current = images;

    const priority1 = [0];
    const priority2 = [29, 59, 89, 119, 149, 179];
    const priority3 = Array.from({ length: TOTAL_FRAMES }, (_, i) => i).filter(
      (i) => !priority1.includes(i) && !priority2.includes(i)
    );

    loadBatch(priority1)
      .then(() => loadBatch(priority2))
      .then(() => loadBatch(priority3));

    return () => {
      imagesRef.current = [];
      decoded.clear();
    };
  }, []);

  // Scroll-driven frame animation
  useEffect(() => {
    if (typeof window === "undefined" || !loaded || failed) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = sectionRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      // Sticky section progress: 0 when section top hits viewport top,
      // 1 when the sticky range ends (sectionHeight - viewportHeight scrolled).
      const scrollRange = Math.max(1, sectionHeight - viewportHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / scrollRange));

      setScrollProgress(progress);

      const targetFrame = progress * (TOTAL_FRAMES - 1);
      targetFrameRef.current = targetFrame;

      // On every scroll update: update target, restart RAF if loop is idle
      startAnimation();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // First scroll update after loading must start RAF immediately
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      previousTimestampRef.current = null;
    };
  }, [loaded, failed, startAnimation]);

  // Cancel scroll RAF on unmount
  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, []);

  // GSAP pointer parallax with quickTo (GSAP only for parallax)
  useEffect(() => {
    if (typeof window === "undefined" || !loaded || failed) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData =
      typeof navigator !== "undefined" &&
      "connection" in navigator &&
      (navigator as { connection?: { saveData?: boolean } }).connection?.saveData;
    const isMobile = window.innerWidth < 768;

    if (prefersReducedMotion || saveData || isMobile) return;

    let gsapInstance: typeof import("gsap").gsap | undefined;
    let quickToX: ((value: number) => void) | undefined;
    let quickToY: ((value: number) => void) | undefined;
    let cleanupFn: (() => void) | undefined;

    import("gsap").then((mod) => {
      gsapInstance = mod.gsap;

      if (!parallaxRef.current) return;

      quickToX = gsapInstance.quickTo(parallaxRef.current, "x", {
        duration: 0.5,
        ease: "power2.out",
      });
      quickToY = gsapInstance.quickTo(parallaxRef.current, "y", {
        duration: 0.5,
        ease: "power2.out",
      });

      const handlePointerMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse" || !quickToX || !quickToY) return;

        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;

        quickToX(x);
        quickToY(y);
      };

      const handlePointerLeave = () => {
        if (quickToX && quickToY) {
          quickToX(0);
          quickToY(0);
        }
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerleave", handlePointerLeave);

      cleanupFn = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerleave", handlePointerLeave);
      };
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [loaded, failed]);

  // Handle scroll indicator click with internal RAF scrolling
  const handleIndicatorClick = useCallback(() => {
    if (typeof window === "undefined") return;

    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Target: min(current scroll + 0.85 viewport, cinematic section end)
    const sectionTop = section.offsetTop;
    const sectionEnd = sectionTop + section.offsetHeight - window.innerHeight;
    const targetY = Math.min(
      window.scrollY + window.innerHeight * 0.85,
      sectionEnd
    );
    const clampedTarget = clampScrollTarget(targetY);

    if (process.env.NODE_ENV === "development") {
      console.debug("[CinematicHero] indicator clicked", {
        currentY: window.scrollY,
        targetY: clampedTarget,
        sectionEnd,
      });
    }

    if (prefersReducedMotion) {
      window.scrollTo(0, clampedTarget);
      return;
    }

    animateWindowScroll(clampedTarget);
  }, [animateWindowScroll]);

  // Handle exit cue click with internal RAF scrolling
  const handleExitCueClick = useCallback(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const homeContent = document.getElementById("home-content");

    if (!homeContent) return;

    // Absolute document Y of #home-content
    const targetY =
      homeContent.getBoundingClientRect().top + window.scrollY;
    const clampedTarget = clampScrollTarget(targetY);

    if (prefersReducedMotion) {
      window.scrollTo(0, clampedTarget);
      return;
    }

    animateWindowScroll(clampedTarget);
  }, [animateWindowScroll]);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const showPoster = prefersReducedMotion || isMobile || failed || !loaded;
  const showScrollIndicator = scrollProgress < INDICATOR_FADE_THRESHOLD;
  const showExitCue = scrollProgress > EXIT_CUE_THRESHOLD;

  return (
    <section ref={sectionRef} className="relative h-[500vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {!showPoster && (
          <div ref={parallaxRef} className="absolute inset-0 pointer-events-none">
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="absolute inset-0 h-full w-full pointer-events-none"
              style={{ transform: `scale(${ZOOM_FACTOR})` }}
            />
          </div>
        )}

        {showPoster && (
          <div className="absolute inset-0 pointer-events-none">
            <NextImage
              src="/images/cinematic-smooth/frame-001.jpg"
              alt=""
              fill
              priority
              className="object-cover"
              style={{ transform: `scale(${ZOOM_FACTOR})` }}
            />
          </div>
        )}

        {!loaded && !failed && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-[#0D2922]/80 pointer-events-none">
            <div className="text-center text-white">
              <div className="mb-4 text-4xl font-bold">{Math.round(progress)}%</div>
              <div className="text-sm">{locale === "tr" ? "Yükleniyor..." : "Loading..."}</div>
            </div>
          </div>
        )}

        <div className="relative z-10 flex h-full items-center justify-center px-6 lg:px-8 pointer-events-none">
          <div className="max-w-4xl text-center pointer-events-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F] backdrop-blur-sm">
              <Sparkles size={14} />
              {dict.home.hero.eyebrow}
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              {dict.home.hero.title}
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/90">{dict.home.hero.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <ButtonLink href={getRoutePath("appointment", locale)} variant="primary">
                {dict.home.hero.primaryCta}
              </ButtonLink>
              <ButtonLink href={`https://wa.me/${siteConfig.whatsappNumber}`} variant="secondary" external>
                {dict.home.hero.secondaryCta}
              </ButtonLink>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-white/80">
              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                {siteConfig.location}
              </div>
              <a
                href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, "")}`}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm transition hover:border-white/40 hover:text-white"
              >
                <PhoneCall size={16} />
                {siteConfig.phone}
              </a>
            </div>
          </div>
        </div>

        {!showPoster && showScrollIndicator && (
          <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 pointer-events-none">
            <button
              type="button"
              onClick={handleIndicatorClick}
              className="flex flex-col items-center gap-2 text-white/80 transition-opacity duration-300 hover:text-white pointer-events-auto"
              aria-label={locale === "tr" ? "Keşfetmek için kaydır" : "Scroll to explore"}
            >
              <span className="text-xs font-medium uppercase tracking-wider text-shadow">
                {locale === "tr" ? "Keşfetmek için kaydır" : "Scroll to explore"}
              </span>
              <ChevronDown
                size={24}
                className={prefersReducedMotion ? "" : "animate-bounce"}
              />
            </button>
          </div>
        )}

        {!showPoster && showExitCue && (
          <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 pointer-events-none">
            <button
              type="button"
              onClick={handleExitCueClick}
              className="flex flex-col items-center gap-2 text-white/80 transition-opacity duration-300 hover:text-white pointer-events-auto"
              aria-label={locale === "tr" ? "Sayfayı keşfetmeye devam et" : "Continue exploring"}
            >
              <span className="text-xs font-medium uppercase tracking-wider text-shadow">
                {locale === "tr" ? "Sayfayı keşfetmeye devam et" : "Continue exploring"}
              </span>
              <ChevronDown size={24} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
