/**
 * Desktop sticky storytelling: sticky media + scrolling narrative items.
 * Mobile: simple vertical sequence (no sticky trap).
 */

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { loadGsap } from "@/src/components/motion/load-gsap";
import { useReducedMotion } from "@/src/components/motion";
import { IMMERSIVE } from "./immersive-config";

export type StickyStoryItem = {
  id: string;
  title: string;
  description: string;
};

type StickyStoryProps = {
  items: StickyStoryItem[];
  media: ReactNode;
  className?: string;
};

export function StickyStory({ items, media, className = "" }: StickyStoryProps) {
  const reduced = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    if (typeof window === "undefined") return;
    if (window.innerWidth < IMMERSIVE.mobile) return;
    if (!listRef.current) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;

    loadGsap()
      .then(({ gsap }) => {
        if (cancelled || !listRef.current) return;
        const cards = listRef.current.querySelectorAll<HTMLElement>("[data-story-item]");
        if (!cards.length) return;

        ctx = gsap.context(() => {
          cards.forEach((card) => {
            gsap.fromTo(
              card,
              { autoAlpha: 0.35, y: 18 },
              {
                autoAlpha: 1,
                y: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  start: "top 75%",
                  end: "top 35%",
                  scrub: 0.4,
                },
              },
            );
          });
        }, listRef);
      })
      .catch(() => {
        // Static narrative.
      });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced, items]);

  return (
    <div className={`grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start ${className}`.trim()}>
      <div className="lg:sticky lg:top-28 lg:self-start">{media}</div>
      <div ref={listRef} className="space-y-6">
        {items.map((item, index) => (
          <article
            key={item.id}
            data-story-item
            className="rounded-[1.5rem] border border-[#0D2922]/10 bg-white/90 p-6 shadow-[0_12px_35px_rgba(13,41,34,0.06)] backdrop-blur-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-[#0D2922]">{item.title}</h3>
              <span aria-hidden="true" className="text-xs font-semibold tracking-[0.28em] text-[#CDA85F]">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <p className="mt-3 text-base leading-8 text-[#687A75]">{item.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
