import Link from "next/link";
import { CalendarDays, Menu, PhoneCall } from "lucide-react";

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
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d8b36a]/40 bg-[#0f2d24] text-[#d8b36a] shadow-[0_10px_35px_rgba(216,179,106,0.2)]">
            <span className="text-lg font-semibold">M</span>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d8b36a]">
              MeteVet
            </p>
            <p className="text-sm text-[#d8e2dd]">Premium Veterinary Care</p>
          </div>
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
