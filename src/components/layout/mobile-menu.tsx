"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, PhoneCall, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Locale } from "@/types";
import { getRoutePath, type RouteName } from "@/src/lib/routes";
import { Logo } from "@/src/components/brand/logo";
import { getDictionary } from "@/src/lib/i18n";
import { siteConfig } from "@/src/data/site";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileMenu({
  open,
  onClose,
  locale,
  links,
}: {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  links: Array<{ label: string; route: RouteName }>;
}) {
  const pathname = usePathname();
  const dict = getDictionary(locale);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // A dialog that traps focus must also give it back when it closes, and
  // never leave keyboard users able to tab into the page scrolling behind it.
  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement;
    closeButtonRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={panelRef} id="mobile-navigation" className="fixed inset-0 z-50 overflow-y-auto bg-[#F4F0E8] pt-[env(safe-area-inset-top)] xl:hidden" role="dialog" aria-modal="true" aria-label={locale === "tr" ? "Mobil navigasyon" : "Mobile navigation"}>
      <div className="flex h-[68px] items-center justify-between border-b border-black/10 px-6">
        <Logo locale={locale} layout="horizontal" markSize={40} />
        <button ref={closeButtonRef} onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-[#0D2922] transition hover:border-[#123A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30" aria-label={locale === "tr" ? "Menüyü kapat" : "Close navigation"}>
          <X size={18} />
        </button>
      </div>
      <nav className="flex flex-col gap-3 p-6">
        {links.map((link) => {
          const localizedHref = getRoutePath(link.route, locale);
          const active = pathname === localizedHref;
          return (
            <Link key={link.label} href={localizedHref} onClick={onClose} aria-current={active ? "page" : undefined} className={`rounded-2xl px-4 py-3 text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30 ${active ? "bg-[#123A30] text-white" : "bg-white text-[#0D2922] hover:bg-[#DDE9E3]"}`}>
              {link.label}
            </Link>
          );
        })}
        <div className="mt-3 grid gap-3 border-t border-[#0D2922]/10 pt-6 sm:grid-cols-2">
          <a href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, "")}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#123A30]/15 bg-white px-5 text-sm font-semibold text-[#123A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30">
            <PhoneCall size={16} />{dict.common.callNow}
          </a>
          <Link href={getRoutePath("appointment", locale)} onClick={onClose} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#123A30] px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30">
            <CalendarDays size={16} />{dict.common.appointmentCta}
          </Link>
        </div>
      </nav>
    </div>
  );
}
