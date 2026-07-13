"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, PhoneCall, X } from "lucide-react";
import type { Locale } from "@/types";
import { getRoutePath, type RouteName } from "@/src/lib/routes";
import { Logo } from "@/src/components/brand/logo";
import { getDictionary } from "@/src/lib/i18n";
import { siteConfig } from "@/src/data/site";

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F4F0E8] xl:hidden" role="dialog" aria-modal="true" aria-label={locale === "tr" ? "Mobil navigasyon" : "Mobile navigation"}>
      <div className="flex h-[68px] items-center justify-between border-b border-black/10 px-6">
        <Logo locale={locale} layout="horizontal" markSize={40} />
        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-[#0D2922] transition hover:border-[#123A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30" aria-label={locale === "tr" ? "Menüyü kapat" : "Close navigation"}>
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
