"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function DiscoveryHotspot({
  id,
  title,
  body,
  discoverLabel,
  closeLabel,
  onDiscovered,
}: {
  id: string;
  title: string;
  body: string;
  discoverLabel: string;
  closeLabel: string;
  onDiscovered: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div data-discovery-id={id} className="pointer-events-auto relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen(true);
          onDiscovered();
        }}
        className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#0D2922]/78 px-4 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F]"
      >
        <Plus size={16} aria-hidden="true" />
        {discoverLabel}: {title}
      </button>
      {open ? (
        <div role="dialog" aria-modal="false" aria-labelledby={`${id}-title`} className="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-3rem))] rounded-2xl border border-[#0D2922]/10 bg-[#F4F0E8]/95 p-5 text-[#0D2922] shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            <h3 id={`${id}-title`} className="text-lg font-semibold">{title}</h3>
            <button type="button" onClick={close} aria-label={closeLabel} className="rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F]">
              <X size={17} aria-hidden="true" />
            </button>
          </div>
          <p className="mt-3 text-sm leading-7 text-[#687A75]">{body}</p>
        </div>
      ) : null}
    </div>
  );
}

