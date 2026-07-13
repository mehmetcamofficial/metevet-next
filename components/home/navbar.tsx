import Link from "next/link";
import { CalendarDays, Menu, PhoneCall } from "lucide-react";
import { Logo } from "@/src/components/brand/logo";

const navItems = [
  { label: "Hakkımızda", href: "#about" },
  { label: "Hizmetler", href: "#services" },
  { label: "Doktor", href: "#doctor" },
  { label: "Blog", href: "#blog" },
  { label: "İletişim", href: "#contact" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#081a16]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" aria-label="MeteVet home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F]/50">
          <Logo locale="en" variant="light" layout="horizontal" markSize={42} />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-[#d8e2dd] lg:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/905000000000"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-full border border-[#d8b36a]/30 bg-[#0f2d24] px-4 py-2 text-sm font-medium text-[#f4e7c5] transition hover:border-[#d8b36a] sm:flex"
          >
            <PhoneCall size={16} />
            WhatsApp
          </a>
          <a
            href="#appointment"
            className="flex items-center gap-2 rounded-full bg-[#d8b36a] px-4 py-2 text-sm font-semibold text-[#081a16] transition hover:brightness-110"
          >
            <CalendarDays size={16} />
            Randevu
          </a>
          <button className="rounded-full border border-white/10 p-2 text-white lg:hidden" aria-label="Open menu">
            <Menu size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
