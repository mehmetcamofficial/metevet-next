"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLocalizedPath } from "@/src/lib/i18n";
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
        const href = getLocalizedPath(pathname, locale.code);
        const active = pathname.startsWith(`/${locale.code}`) || (locale.code === "tr" && pathname === "/");

        return (
          <Link
            key={locale.code}
            href={href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
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
