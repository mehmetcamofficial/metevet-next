"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAdaptiveQuality } from "./AdaptiveQuality";
import { SceneFallback } from "./SceneFallback";
import { WEBGL_CONFIG, type WebGLSceneKind } from "./webgl-config";

type JourneyCopy = {
  title: string;
  supporting: string;
};

const SceneCanvas = dynamic(() => import("./SceneCanvas"), {
  ssr: false,
  loading: () => null,
});

export function WebGLProvider({
  scene,
  poster,
  posterAlt,
  children,
  journey = false,
  journeyCopy,
  className = "",
}: {
  scene: WebGLSceneKind;
  poster: string;
  posterAlt: string;
  children?: ReactNode;
  journey?: boolean;
  journeyCopy?: readonly JourneyCopy[];
  className?: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const { quality, ready } = useAdaptiveQuality();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "20% 0px" },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const raw = journey
        ? -rect.top / Math.max(1, root.offsetHeight - window.innerHeight)
        : (window.innerHeight - rect.top) / Math.max(1, window.innerHeight + rect.height);
      setProgress(Math.min(1, Math.max(0, raw)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [journey]);

  const showCanvas = scene !== "clinic" && ready && quality !== "low" && active;
  const thresholdOpacity = journey ? Math.max(0, 1 - progress / 0.08) : 0;

  return (
    <section
      ref={rootRef}
      data-webgl-scene={scene}
      className={`relative ${className}`.trim()}
      style={journey ? { height: WEBGL_CONFIG.journeyHeight } : undefined}
    >
      <div className={journey ? "sticky top-0 h-screen overflow-hidden" : "relative h-[520px] overflow-hidden rounded-[1.8rem]"}>
        <SceneFallback src={poster} alt={posterAlt} className="absolute inset-0" />
        {showCanvas ? (
          <div className="absolute inset-0" aria-hidden="true">
            <SceneCanvas scene={scene} progress={progress} quality={quality} active={active} />
          </div>
        ) : null}
        {journey ? (
          <div
            data-journey-threshold
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[9] bg-[radial-gradient(ellipse_at_center,rgba(244,240,232,0.82),rgba(13,41,34,0.94)_72%)] transition-[opacity,clip-path] duration-[600ms] ease-out motion-reduce:!opacity-0 motion-reduce:transition-none"
            style={{
              opacity: thresholdOpacity,
              clipPath: `inset(0 ${Math.min(48, progress * 600)}% round 2rem)`,
            }}
          >
            <div className="absolute inset-x-[18%] inset-y-[12%] rounded-t-[45%] border border-[#CDA85F]/25 shadow-[inset_0_0_80px_rgba(205,168,95,0.12)]" />
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-0 z-30">{children}</div>
        {journeyCopy ? (
          <div className="pointer-events-none absolute inset-0 z-30 mx-auto max-w-7xl px-6 lg:px-8">
            {journeyCopy.map((copy, index) => {
              const starts = WEBGL_CONFIG.journeyStageStarts;
              let activeIndex = starts.findLastIndex((start) => progress >= start);
              activeIndex = Math.max(0, activeIndex);
              const start = starts[activeIndex];
              const end = starts[activeIndex + 1] ?? 1;
              const localProgress = (progress - start) / Math.max(0.001, end - start);
              const distance = Math.abs(index - activeIndex);
              const isActive = index === activeIndex;
              const adjacentOpacity =
                !isActive && distance === 1 && localProgress > 0.78
                  ? Math.min(0.12, (localProgress - 0.78) * 0.55)
                  : 0;
              const opacity = isActive ? 1 : Math.max(0, adjacentOpacity);
              return (
                <article
                  key={copy.title}
                  aria-hidden={!isActive}
                  className={`absolute inset-x-6 bottom-24 max-w-xl rounded-[1.5rem] border border-white/20 bg-[#0D2922]/75 p-6 text-white shadow-2xl backdrop-blur-md transition-[opacity,transform] duration-300 lg:bottom-20 lg:left-8 lg:right-auto ${
                    isActive ? "pointer-events-auto" : "pointer-events-none"
                  }`}
                  style={{ opacity, transform: `translateY(${(1 - opacity) * 18}px)` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">
                    MeteVet · {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold sm:text-4xl">{copy.title}</h2>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-white/75 sm:text-base">
                    {copy.supporting}
                  </p>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
