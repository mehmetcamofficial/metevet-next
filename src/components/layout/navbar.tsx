"use client";

import Link from "next/link";
import { Menu, PhoneCall, CalendarDays } from "lucide-react";
import { useState } from "react";
import { MobileMenu } from "@/src/components/layout/mobile-menu";
import { LanguageSwitcher } from "@/src/components/shared/language-switcher";
import { getDictionary } from "@/src/lib/i18n";
import { getRoutePath, type RouteName } from "@/src/lib/routes";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/src/data/site";
import type { Locale } from "@/types";
import { Logo } from "@/src/components/brand/logo";

export function Navbar({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dict = getDictionary(locale);

  const links: Array<{ label: string; route: RouteName }> = [
    { label: dict.nav.home, route: "home" },
    { label: dict.nav.about, route: "about" },
    { label: dict.nav.services, route: "services" },
    { label: dict.nav.blog, route: "blog" },
    { label: dict.nav.contact, route: "contact" },
  ];

  const isLocalizedHome = pathname === `/${locale}` || pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-[#0D2922]/10 bg-[#F4F0E8]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href={getRoutePath("home", locale)}
          aria-label={locale === "tr" ? "MeteVet ana sayfa" : "MeteVet home"}
          className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30"
        >
          <Logo locale={locale} layout="icon-only" markSize={40} className="sm:hidden" />
          <Logo locale={locale} layout="horizontal" markSize={40} className="hidden sm:inline-flex" descriptorClassName="hidden 2xl:block" />
        </Link>

        <nav aria-label={locale === "tr" ? "Ana navigasyon" : "Primary navigation"} className="hidden min-w-0 items-center gap-5 text-sm font-medium text-[#0D2922] xl:flex 2xl:gap-7">
          {links.map((link) => {
            const href = getRoutePath(link.route, locale);
            const active = pathname === href || (link.route === "home" && isLocalizedHome);
            return (
              <Link key={link.label} href={href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-md px-1 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30 ${active ? "text-[#123A30]" : "text-[#0D2922]/80 hover:text-[#123A30]"}`}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <a href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, "")}`} aria-label={`${dict.common.callNow}: ${siteConfig.phone}`} className="hidden h-10 items-center gap-2 rounded-full border border-[#123A30]/15 bg-white px-3 text-sm font-medium text-[#0D2922] transition hover:border-[#123A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30 lg:flex">
            <PhoneCall size={16} />
            <span className="hidden 2xl:inline">{dict.common.callNow}</span>
          </a>
          <Link href={getRoutePath("appointment", locale)} aria-label={dict.common.appointmentCta} className="flex h-10 items-center justify-center gap-2 rounded-full bg-[#123A30] px-3 text-sm font-semibold text-white transition hover:bg-[#0D2922] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30 md:px-4">
            <CalendarDays size={16} />
            <span className="hidden whitespace-nowrap md:inline">{dict.common.appointmentCta}</span>
          </Link>
          <button onClick={() => setOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#123A30]/15 bg-white text-[#123A30] transition hover:border-[#123A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30 xl:hidden" aria-label={locale === "tr" ? "Menüyü aç" : "Open menu"}>
            <Menu size={18} />
          </button>
        </div>
      </div>
      <MobileMenu open={open} onClose={() => setOpen(false)} locale={locale} links={links} />
    </header>
  );
}
