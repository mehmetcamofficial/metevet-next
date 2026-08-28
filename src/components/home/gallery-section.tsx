"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  DepthMedia,
  IMMERSIVE,
  PerspectiveCard,
  SpotlightSurface,
} from "@/src/components/immersive";
import { Reveal } from "@/src/components/motion";

const galleryImages = [
  { src: "/images/clinic/clinic-exam-room.png", alt: "MeteVet muayene odası" },
  { src: "/images/clinic/clinic-treatment-room.png", alt: "MeteVet tedavi odası" },
  { src: "/images/clinic/clinic-waiting.png", alt: "MeteVet bekleme alanı" },
];

export function GallerySection() {
  const firstCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.info("[GallerySection] mounted");
    const card = firstCardRef.current;
    if (!card) return;
    const mediaParent = card;
    const styles = window.getComputedStyle(mediaParent);
    console.info("[GallerySection] first card diagnostics", {
      cardHeight: card.getBoundingClientRect().height,
      imageParentPosition: styles.position,
      imageParentHeight: mediaParent.getBoundingClientRect().height,
    });
  }, []);

  return (
    <section className="relative overflow-hidden px-6 py-20 sm:py-24 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full bg-[#CDA85F]/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 bottom-16 h-72 w-72 rounded-full bg-[#123A30]/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">Galeri</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">
            Klinik deneyimini yansıtan alanlar
          </h2>
        </Reveal>

        {/*
          Full-bleed immersive media cards.
          Mobile: simple stacked/grid, no vertical offsets.
          Desktop: alternating offsets + tilt + depth.
        */}
        <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6 md:pb-14">
          {galleryImages.map((image, index) => {
            const offsetY =
              typeof window === "undefined"
                ? IMMERSIVE.galleryOffsets[index] ?? 0
                : IMMERSIVE.galleryOffsets[index] ?? 0;

            return (
              <PerspectiveCard
                key={image.src}
                offsetY={offsetY}
                className="group h-full md:h-[420px]"
              >
                <SpotlightSurface
                  className="relative aspect-[3/4] h-auto overflow-hidden rounded-[1.6rem] border border-[#0D2922]/12 bg-[#DDE9E3] shadow-[0_18px_50px_rgba(13,41,34,0.12)] md:aspect-auto md:h-full"
                >
                  <div
                    ref={index === 0 ? firstCardRef : undefined}
                    data-gallery-media
                    className="relative h-full w-full"
                  >
                  <DepthMedia
                    className="absolute inset-0 h-full w-full"
                    maxDistance={index % 2 === 0 ? 20 : 28}
                    direction={index % 2 === 0 ? 1 : -1}
                    hoverScale
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="z-0 object-cover opacity-100 visible"
                      data-gallery-image
                      onLoad={() => {
                        if (process.env.NODE_ENV === "development") {
                          console.info("[GallerySection] image loaded", image.src);
                        }
                      }}
                      onError={() => {
                        if (process.env.NODE_ENV === "development") {
                          console.error("[GallerySection] image failed", image.src);
                        }
                      }}
                    />
                  </DepthMedia>

                  {/* Bottom gradient for caption readability */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/5 bg-gradient-to-t from-[#0D2922]/85 via-[#0D2922]/35 to-transparent"
                  />

                  <div className="glass-caption absolute inset-x-3 bottom-3 z-20 rounded-xl px-3 py-2.5 text-xs font-medium leading-5 text-white/95 sm:inset-x-4 sm:bottom-4 sm:text-sm">
                    {image.alt}
                  </div>
                  </div>
                </SpotlightSurface>
              </PerspectiveCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
