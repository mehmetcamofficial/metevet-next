"use client";

import { Cat } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/types";
import { CarePathQuiz } from "./CarePathQuiz";
import { DiscoveryHotspot } from "./DiscoveryHotspot";
import { JourneyCompletion } from "./JourneyCompletion";
import { JourneyProgress } from "./JourneyProgress";
import {
  DISCOVERY_STAGE,
  interactiveCopy,
  type DiscoveryId,
} from "./interactive-clinic-config";

const DISCOVERY_IDS = ["preventive", "examination", "diagnosis", "recovery"] as const;
const STAGE_STARTS = [0, 0.18, 0.38, 0.58, 0.78] as const;

export default function ClinicJourneyExperience({ locale }: { locale: Locale }) {
  const copy = interactiveCopy[locale];
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRaf = useRef<number | null>(null);
  const [stage, setStage] = useState(0);
  const [discovered, setDiscovered] = useState<Set<DiscoveryId>>(() => new Set());

  useEffect(() => {
    const journey = rootRef.current?.closest<HTMLElement>('[data-webgl-scene="clinic"]');
    if (!journey) return;
    const update = () => {
      scrollRaf.current = null;
      const rect = journey.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, journey.offsetHeight - window.innerHeight)));
      let nextStage = 0;
      for (let index = 0; index < STAGE_STARTS.length; index += 1) {
        if (progress >= STAGE_STARTS[index]) nextStage = index;
      }
      setStage(nextStage);
    };
    const onScroll = () => {
      if (scrollRaf.current === null) scrollRaf.current = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollRaf.current !== null) window.cancelAnimationFrame(scrollRaf.current);
    };
  }, []);

  const activeDiscovery = DISCOVERY_IDS.find((id) => DISCOVERY_STAGE[id] === stage);
  const markDiscovered = (id: DiscoveryId) => {
    setDiscovered((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute left-4 top-20 sm:left-auto sm:right-6">
        {stage === 0 ? (
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-[#0D2922]/72 px-3 py-2 text-sm font-semibold text-white shadow-xl backdrop-blur-md">
            <Cat size={16} aria-hidden="true" className="text-[#CDA85F]" />
            {copy.interactiveCat}
          </div>
        ) : null}
      </div>

      <div className="absolute right-4 top-5 sm:right-6">
        <JourneyProgress label={copy.progress(discovered.size)} count={discovered.size} />
      </div>

      {activeDiscovery ? (
        <div className="absolute right-4 top-[42%] sm:right-8">
          <DiscoveryHotspot
            id={activeDiscovery}
            title={copy.discoveries[activeDiscovery].title}
            body={copy.discoveries[activeDiscovery].body}
            discoverLabel={copy.discover}
            closeLabel={copy.close}
            onDiscovered={() => markDiscovered(activeDiscovery)}
          />
        </div>
      ) : null}

      {discovered.size >= 2 && discovered.size < 4 ? (
        <div className="absolute bottom-6 right-4 hidden sm:block">
          <CarePathQuiz
            locale={locale}
            question={copy.quizQuestion}
            options={copy.quizOptions}
            disclaimer={copy.disclaimer}
            suggestion={copy.suggestion}
            appointmentLabel={copy.appointment}
            whatsappLabel={copy.whatsapp}
          />
        </div>
      ) : null}

      {discovered.size === 4 ? (
        <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-center">
          <JourneyCompletion
            locale={locale}
            title={copy.completed}
            summary={copy.summary}
            appointmentLabel={copy.appointment}
            whatsappLabel={copy.whatsapp}
            directionsLabel={copy.directions}
          />
        </div>
      ) : null}

    </div>
  );
}
