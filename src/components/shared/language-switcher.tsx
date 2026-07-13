"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getEquivalentRoute } from "@/src/lib/routes";
import type { Locale } from "@/types";

const locales: Array<{ code: Locale; label: string }> = [
  { code: "tr", label: "TR" },
  { code: "en", label: "EN" },
];

export function LanguageSwitcher() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 p-1">
      {locales.map((locale) => {
        const href = getEquivalentRoute(pathname, locale.code);
        const active = pathname.startsWith(`/${locale.code}`) || (locale.code === "tr" && pathname === "/");

        return (
          <Link
            key={locale.code}
            href={href}
            aria-label={locale.code === "tr" ? "Türkçe" : "English"}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30 ${
              active ? "bg-[#123A30] text-white shadow-sm" : "text-[#0D2922] hover:bg-[#F4F0E8]"
            }`}
          >
            {locale.label}
          </Link>
        );
      })}
    </div>
  );
}
