import Link from "next/link";
import { MapPin, Phone, Send } from "lucide-react";
import { getDictionary } from "@/src/lib/i18n";
import { getRoutePath } from "@/src/lib/routes";
import { siteConfig } from "@/src/data/site";
import type { Locale } from "@/types";
import { Reveal } from "@/src/components/ui/reveal";
import Image from "next/image";

export function ContactPreview({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <section className="px-6 pb-20 sm:pb-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] border border-[#0D2922]/10 bg-white p-8 shadow-[0_20px_60px_rgba(13,41,34,0.08)] lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
        <Reveal delay={0.04}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{dict.home.contact.title}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">{dict.home.contact.description}</h2>
            <div className="mt-8 space-y-4 text-base text-[#687A75]">
              <div className="flex items-start gap-3"><MapPin className="mt-1 text-[#123A30]" size={18} /> <span>{siteConfig.location}</span></div>
              <div className="flex items-center gap-3"><Phone className="text-[#123A30]" size={18} /> <a href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, "")}`} className="transition hover:text-[#123A30]">{siteConfig.phone}</a></div>
              <div className="flex items-center gap-3"><Send className="text-[#123A30]" size={18} /> <a href={`https://wa.me/${siteConfig.whatsappNumber}`} target="_blank" rel="noreferrer" className="transition hover:text-[#123A30]">WhatsApp</a></div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-[1.5rem] border border-[#0D2922]/10 bg-[#F4F0E8] p-3">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[1.2rem]">
              <Image
                src="/images/clinic/clinic-exterior.png"
                alt="MeteVet Veteriner Kliniği dış görünümü"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
            <div className="rounded-[1.2rem] border border-[#0D2922]/10 bg-white p-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">Google Maps</p>
              <p className="mt-4 text-lg font-semibold text-[#0D2922]">{locale === "tr" ? siteConfig.addressNote : siteConfig.addressNoteEn}</p>
              <p className="mt-3 text-base leading-8 text-[#687A75]">{locale === "tr" ? "Tam klinik adresi yakında eklenecektir. Detaylı yol tarifi ve harita bağlantısı güncellenmektedir." : "The full clinic address will be added soon. Directions and map integration will be updated shortly."}</p>
              <Link href={getRoutePath("contact", locale)} className="mt-6 inline-flex items-center rounded-full bg-[#123A30] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">{dict.common.learnMore}</Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
