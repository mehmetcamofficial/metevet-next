"use client";

import { Canvas } from "@react-three/fiber";
import { Cat } from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Locale } from "@/types";
import { useAdaptiveQuality } from "../AdaptiveQuality";
import {
  JOURNEY_STAGES,
  ClinicJourneyScene,
  getJourneyBlend,
} from "../ClinicJourneyScene";
import { CompanionController } from "./CompanionController";
import { CompanionCamera } from "./CompanionCamera";

const HOME_SECTIONS = [
  "journey",
  "trust",
  "services",
  "doctor",
  "gallery",
  "philosophy",
  "appointment",
  "blog",
  "faq",
  "contact",
  "footer",
] as const;

export function HomepageCompanionLayer({ locale }: { locale: Locale }) {
  const [activated, setActivated] = useState(false);
  const [visible, setVisible] = useState(false);
  const [journeyVisible, setJourneyVisible] = useState(false);
  const [journeyProgress, setJourneyProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("journey");
  const [modelChecked, setModelChecked] = useState(false);
  const [modelVisibleReady, setModelVisibleReady] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugLabelPosition, setDebugLabelPosition] = useState({
    x: 0,
    y: 0,
  });
  const { quality, ready } = useAdaptiveQuality();
  const scrollFrame = useRef<number | null>(null);
  const modelInstanceCount = activated && quality !== "low" ? 1 : 0;
  const handleModelReadiness = useCallback((modelReady: boolean) => {
    setModelChecked(true);
    setModelVisibleReady(modelReady);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const debug = new URLSearchParams(window.location.search).has(
      "companionDebug",
    );
    const debugFrame = window.requestAnimationFrame(() => {
      setDebugMode(debug);
      if (debug) {
        setActivated(true);
        setVisible(true);
      }
    });
    const onProjection = (event: Event) => {
      const detail = (
        event as CustomEvent<{ centerCss: { x: number; y: number } }>
      ).detail;
      if (detail?.centerCss) setDebugLabelPosition(detail.centerCss);
    };
    window.addEventListener("metevet-companion-projection", onProjection);
    return () => {
      window.cancelAnimationFrame(debugFrame);
      window.removeEventListener("metevet-companion-projection", onProjection);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !visible) return;
    const frame = window.requestAnimationFrame(() => {
      const layer = document.querySelector<HTMLElement>(
        "[data-homepage-companion-canvas]",
      );
      const canvas = layer?.querySelector("canvas");
      const layerStyle = layer ? getComputedStyle(layer) : null;
      const canvasStyle = canvas ? getComputedStyle(canvas) : null;
      console.info("[HomepageCompanion] canvas visibility", {
        canvasRect: canvas?.getBoundingClientRect().toJSON(),
        parentRect: layer?.getBoundingClientRect().toJSON(),
        widthAttribute: canvas?.width,
        heightAttribute: canvas?.height,
        cssWidth: canvasStyle?.width,
        cssHeight: canvasStyle?.height,
        zIndex: layerStyle?.zIndex,
        opacity: layerStyle?.opacity,
        visibility: layerStyle?.visibility,
        display: layerStyle?.display,
        transform: layerStyle?.transform,
        parentOpacity: layer?.parentElement
          ? getComputedStyle(layer.parentElement).opacity
          : null,
        parentVisibility: layer?.parentElement
          ? getComputedStyle(layer.parentElement).visibility
          : null,
        transformedAncestor: Boolean(
          layer?.parentElement?.closest(
            '[style*="transform"], [style*="filter"], .transform',
          ),
        ),
        rendererConnected: canvas?.isConnected ?? false,
      });

      for (const element of document.querySelectorAll<HTMLElement>(
        "[data-companion-hit-test]",
      )) {
        const rect = element.getBoundingClientRect();
        if (
          rect.width <= 0 ||
          rect.height <= 0 ||
          rect.bottom < 0 ||
          rect.top > window.innerHeight
        ) continue;
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const topmost = document.elementFromPoint(x, y);
        console.info("[HomepageCompanion] hit test", {
          requested: element.dataset.companionHitTest,
          expected: element,
          topmost,
          closestInteractive: topmost?.closest("a,button"),
        });
      }
    });
    const logClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const topmost = document.elementFromPoint(event.clientX, event.clientY);
      console.info("[HomepageCompanion] click diagnostic", {
        target,
        closestInteractive: target?.closest("a,button"),
        topmost,
        preventedDefault: event.defaultPrevented,
      });
    };
    document.addEventListener("click", logClick, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("click", logClick, true);
    };
  }, [activeSection, visible]);

  useEffect(() => {
    const sections = HOME_SECTIONS.map((id) =>
      document.querySelector<HTMLElement>(`[data-home-section="${id}"]`),
    ).filter((section): section is HTMLElement => Boolean(section));
    const journey = document.querySelector<HTMLElement>(
      '[data-home-section="journey"]',
    );
    if (!journey) return;

    const update = () => {
      scrollFrame.current = null;
      const rect = journey.getBoundingClientRect();
      const progress = Math.min(
        1,
        Math.max(
          0,
          -rect.top / Math.max(1, journey.offsetHeight - window.innerHeight),
        ),
      );
      const enteredJourney = rect.top <= window.innerHeight * 0.72;
      const aboveJourney = rect.top > window.innerHeight * 0.82;
      const isJourneyVisible =
        rect.bottom > 0 && rect.top < window.innerHeight;
      if (enteredJourney) setActivated(true);
      setVisible(!aboveJourney);
      setJourneyVisible(isJourneyVisible);
      setJourneyProgress(progress);
    };
    const onScroll = () => {
      if (scrollFrame.current === null) {
        scrollFrame.current = window.requestAnimationFrame(update);
      }
    };
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top - window.innerHeight * 0.55) -
              Math.abs(b.boundingClientRect.top - window.innerHeight * 0.55),
          )[0];
        const id = current?.target.getAttribute("data-home-section");
        if (id) setActiveSection(id);
      },
      { rootMargin: "-38% 0px -38% 0px", threshold: 0 },
    );
    sections.forEach((section) => sectionObserver.observe(section));
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      sectionObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (scrollFrame.current !== null) {
        window.cancelAnimationFrame(scrollFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !ready) return;
    console.info("[HomepageCompanion] lifecycle", {
      mounted: true,
      activeSection,
      canvasActive: activated && quality !== "low",
      catVisible: visible,
      modelVisibleReady,
      journeyVisible,
      canvasHandoff: "single-persistent-canvas",
      activeCanvasCount: activated && quality !== "low" ? 1 : 0,
      modelInstanceCount,
      fallback: quality === "low",
    });
  }, [
    activeSection,
    activated,
    journeyVisible,
    modelInstanceCount,
    quality,
    ready,
    visible,
    modelVisibleReady,
  ]);

  if (!ready || !activated) return null;
  const live = quality !== "low";
  const blend = getJourneyBlend(journeyProgress);
  const companionSection = journeyVisible
    ? JOURNEY_STAGES[blend.currentIndex].id
    : activeSection;

  return (
    <>
      {live ? (
        <div
          data-homepage-companion-canvas
          data-canvas-active={visible ? "true" : "false"}
          className={`pointer-events-none fixed inset-0 z-20 bg-transparent ${
            debugMode ? "" : "transition-opacity duration-300"
          } ${
            visible || debugMode ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        >
          <Canvas
            className="pointer-events-none"
            style={{ pointerEvents: "none" }}
            orthographic
            camera={{ position: [0, 0, 10], zoom: 1, near: 0.1, far: 50 }}
            dpr={[1, quality === "high" ? 1.65 : 1.35]}
            frameloop="demand"
            gl={{
              alpha: true,
              antialias: quality === "high",
              powerPreference: "high-performance",
            }}
          >
            <Suspense fallback={null}>
              <CompanionCamera />
              {journeyVisible ? (
                <ClinicJourneyScene
                  quality={quality}
                  progress={journeyProgress}
                />
              ) : (
                <>
                  <ambientLight intensity={0.65} color="#fff8e8" />
                  <hemisphereLight args={["#f7e7c7", "#557266", 1.25]} />
                  <directionalLight
                    position={[2, 4, 4]}
                    intensity={2.2}
                    color="#f1d19a"
                  />
                </>
              )}
              <CompanionController
                activeSectionId={companionSection}
                enabled={visible || debugMode}
                debugMode={debugMode}
                onModelVisibleReady={handleModelReadiness}
              />
            </Suspense>
          </Canvas>
        </div>
      ) : null}
      {visible && (!live || (modelChecked && !modelVisibleReady)) ? (
        <div
          data-companion-fallback
          aria-hidden="true"
          className="pointer-events-none fixed bottom-20 left-6 z-20 grid size-11 place-items-center rounded-full border border-white/20 bg-[#0D2922]/80 text-[#CDA85F] shadow-lg backdrop-blur-md"
        >
          <Cat size={24} />
        </div>
      ) : null}
      {visible && modelVisibleReady ? (
        <div
          className="pointer-events-none fixed z-30"
          style={{
            left: "max(24px, env(safe-area-inset-left))",
            bottom: "max(24px, env(safe-area-inset-bottom))",
          }}
        >
          <button
            type="button"
            data-companion-exclusion="greet-control"
            onClick={() =>
              window.dispatchEvent(new Event("metevet-cat-greet"))
            }
            className="pointer-events-auto flex min-h-11 items-center rounded-full border border-white/20 bg-[#0D2922]/88 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F]"
          >
            {locale === "tr" ? "Kediye merhaba de" : "Greet the cat"}
          </button>
        </div>
      ) : null}
      {process.env.NODE_ENV === "development" && debugMode ? (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded bg-red-600 px-2 py-1 text-xs font-bold text-white"
          style={{
            left: debugLabelPosition.x,
            top: debugLabelPosition.y,
          }}
        >
          CAT POSITION
        </div>
      ) : null}
    </>
  );
}
