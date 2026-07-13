"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import type { Locale } from "@/types";
import { getLocalizedPath } from "@/src/lib/i18n";

export function MobileMenu({
  open,
  onClose,
  locale,
  links,
}: {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  links: Array<{ label: string; href: string }>;
}) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F0E8]/95 backdrop-blur-xl lg:hidden" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#123A30]">MeteVet</p>
        <button onClick={onClose} className="rounded-full border border-black/10 p-2 text-[#0D2922]" aria-label="Close navigation">
          <X size={18} />
        </button>
      </div>
      <nav className="flex flex-col gap-3 p-6">
        {links.map((link) => {
          const localizedHref = getLocalizedPath(link.href, locale);
          const active = pathname === localizedHref;
          return (
            <Link key={link.label} href={localizedHref} onClick={onClose} className={`rounded-2xl px-4 py-3 text-base font-medium ${active ? "bg-[#123A30] text-white" : "bg-white text-[#0D2922]"}`}>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
