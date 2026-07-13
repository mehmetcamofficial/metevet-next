import type { Locale } from "@/types";

export type RouteName = "home" | "about" | "services" | "appointment" | "blog" | "contact";

export const routeMap = {
  home: { tr: "/tr", en: "/en" },
  about: { tr: "/tr/hakkimizda", en: "/en/about" },
  services: { tr: "/tr/hizmetler", en: "/en/services" },
  appointment: { tr: "/tr/randevu", en: "/en/appointment" },
  blog: { tr: "/tr/blog", en: "/en/blog" },
  contact: { tr: "/tr/iletisim", en: "/en/contact" },
} as const satisfies Record<RouteName, Record<Locale, string>>;

export function getRoutePath(route: RouteName, locale: Locale) {
  return routeMap[route][locale];
}

export function getBlogRoute(locale: Locale, slug?: string) {
  const base = getRoutePath("blog", locale);
  return slug ? `${base}/${slug}` : base;
}

const blogSlugMap: Record<Locale, Record<string, string>> = {
  tr: {
    "kedilerde-asi-takvimi-neden-onemlidir": "why-vaccine-schedules-matter-for-cats",
    "kopeklerde-duzenli-veteriner-kontrolu": "why-regular-veterinary-checks-matter-for-dogs",
    "evcil-hayvanlarda-acil-durum-belirtileri": "warning-signs-that-need-urgent-veterinary-attention",
  },
  en: {
    "why-vaccine-schedules-matter-for-cats": "kedilerde-asi-takvimi-neden-onemlidir",
    "why-regular-veterinary-checks-matter-for-dogs": "kopeklerde-duzenli-veteriner-kontrolu",
    "warning-signs-that-need-urgent-veterinary-attention": "evcil-hayvanlarda-acil-durum-belirtileri",
  },
};

export function getEquivalentRoute(pathname: string, locale: Locale) {
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = segments[0] as Locale | undefined;

  if (currentLocale && (currentLocale === "tr" || currentLocale === "en")) {
    const rest = segments.slice(1);
    const normalized = rest.length > 0 ? `/${rest.join("/")}` : "/";

    if (normalized.startsWith("/blog/")) {
      const slug = normalized.replace("/blog/", "");
      if (slug) {
        const targetSlug = blogSlugMap[currentLocale][slug] ?? slug;
        return `/${locale}/blog/${targetSlug}`;
      }
    }

    const routeByPath: Record<string, string> = {
      "/": getRoutePath("home", locale),
      "/hakkimizda": getRoutePath("about", locale),
      "/about": getRoutePath("about", locale),
      "/hizmetler": getRoutePath("services", locale),
      "/services": getRoutePath("services", locale),
      "/randevu": getRoutePath("appointment", locale),
      "/appointment": getRoutePath("appointment", locale),
      "/blog": getRoutePath("blog", locale),
      "/iletisim": getRoutePath("contact", locale),
      "/contact": getRoutePath("contact", locale),
    };

    return routeByPath[normalized] ?? getRoutePath("home", locale);
  }

  return getRoutePath("home", locale);
}
