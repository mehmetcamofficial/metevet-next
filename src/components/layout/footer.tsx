import Link from "next/link";
import { getDictionary } from "@/src/lib/i18n";
import { siteConfig } from "@/src/data/site";
import type { Locale } from "@/types";

export function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#0D2922]/10 bg-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.15fr_0.55fr_0.55fr_0.7fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">MeteVet</p>
          <h2 className="mt-4 text-2xl font-semibold text-[#0D2922]">{dict.footer.title}</h2>
          <p className="mt-4 max-w-md text-base leading-8 text-[#687A75]">{dict.footer.description}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-[#123A30]">{dict.footer.navigation}</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#687A75]">
            <li><Link href={locale === "tr" ? "/tr" : "/en"} className="transition hover:text-[#123A30]">{dict.nav.home}</Link></li>
            <li><Link href={locale === "tr" ? "/tr/hakkimizda" : "/en/about"} className="transition hover:text-[#123A30]">{dict.nav.about}</Link></li>
            <li><Link href={locale === "tr" ? "/tr/hizmetler" : "/en/services"} className="transition hover:text-[#123A30]">{dict.nav.services}</Link></li>
            <li><Link href={locale === "tr" ? "/tr/blog" : "/en/blog"} className="transition hover:text-[#123A30]">{dict.nav.blog}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-[#123A30]">{dict.footer.services}</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#687A75]">
            <li>Genel Muayene</li>
            <li>Aşı ve Koruyucu Hekimlik</li>
            <li>Laboratuvar ve Tanı</li>
            <li>Diş ve Ağız Sağlığı</li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-[#123A30]">{dict.footer.contact}</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#687A75]">
            <li>{siteConfig.location}</li>
            <li><a href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, "")}`} className="transition hover:text-[#123A30]">{siteConfig.phone}</a></li>
            <li><a href={`https://wa.me/${siteConfig.whatsappNumber}`} target="_blank" rel="noreferrer" className="transition hover:text-[#123A30]">WhatsApp</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#0D2922]/10 px-6 py-6 text-sm text-[#687A75] lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {siteConfig.domain.replace("https://", "")}</p>
          <div className="flex flex-wrap gap-4">
            <Link href={locale === "tr" ? "/tr/iletisim" : "/en/contact"} className="transition hover:text-[#123A30]">{dict.footer.contact}</Link>
            <span>{dict.footer.legal}</span>
            <Link href={locale === "tr" ? "/tr/blog" : "/en/blog"} className="transition hover:text-[#123A30]">{dict.footer.language}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
