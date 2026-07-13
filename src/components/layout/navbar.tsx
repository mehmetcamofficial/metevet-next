"use client";

import Link from "next/link";
import { Menu, PhoneCall, CalendarDays } from "lucide-react";
import { useState } from "react";
import { MobileMenu } from "@/src/components/layout/mobile-menu";
import { LanguageSwitcher } from "@/src/components/shared/language-switcher";
import { getDictionary } from "@/src/lib/i18n";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/src/data/site";
import type { Locale } from "@/types";

export function Navbar({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dict = getDictionary(locale);

  const links = [
    { label: dict.nav.home, href: "/" },
    { label: dict.nav.about, href: "/about" },
    { label: dict.nav.services, href: "/services" },
    { label: dict.nav.blog, href: "/blog" },
    { label: dict.nav.contact, href: "/contact" },
  ];

  const isLocalizedHome = pathname === `/${locale}` || pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-[#0D2922]/10 bg-[#F4F0E8]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href={locale === "tr" ? "/tr" : "/en"} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#123A30]/15 bg-[#123A30] text-sm font-semibold text-white shadow-sm">
            MV
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#123A30]">MeteVet</p>
            <p className="text-sm text-[#687A75]">Veteriner Kliniği</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-[#0D2922] lg:flex">
          {links.map((link) => {
            const href = locale === "tr" ? `/tr${link.href}` : `/en${link.href}`;
            const active = pathname === href || (link.href === "/" && isLocalizedHome);
            return (
              <Link key={link.label} href={href} className={`transition ${active ? "text-[#123A30]" : "text-[#0D2922]/80 hover:text-[#123A30]"}`}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, "")}`} className="hidden items-center gap-2 rounded-full border border-[#123A30]/15 bg-white px-4 py-2 text-sm font-medium text-[#0D2922] shadow-sm transition hover:border-[#123A30] sm:flex">
            <PhoneCall size={16} />
            {dict.common.callNow}
          </a>
          <Link href={locale === "tr" ? "/tr/randevu" : "/en/appointment"} className="hidden items-center gap-2 rounded-full bg-[#123A30] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 sm:flex">
            <CalendarDays size={16} />
            {dict.common.appointmentCta}
          </Link>
          <button onClick={() => setOpen(true)} className="rounded-full border border-[#123A30]/15 bg-white p-2 text-[#123A30] shadow-sm lg:hidden" aria-label="Open menu">
            <Menu size={18} />
          </button>
        </div>
      </div>
      <MobileMenu open={open} onClose={() => setOpen(false)} locale={locale} links={links} />
    </header>
  );
}
