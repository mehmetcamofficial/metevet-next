import Link from "next/link";
import { CalendarDays, PhoneCall, MessageCircleMore } from "lucide-react";
import { getDictionary } from "@/src/lib/i18n";
import { getRoutePath } from "@/src/lib/routes";
import { siteConfig } from "@/src/data/site";
import type { Locale } from "@/types";
import { Reveal } from "@/src/components/ui/reveal";

export function AppointmentCTA({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <section className="px-6 pb-20 sm:pb-24 lg:px-8">
      <Reveal>
        <div className="mx-auto max-w-7xl rounded-[2.2rem] border border-[#0D2922]/10 bg-[#123A30] p-8 text-white shadow-[0_24px_70px_rgba(13,41,34,0.15)] lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{dict.home.appointment.title}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{dict.home.appointment.description}</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, "")}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/20">
                <PhoneCall size={16} />
                {dict.home.appointment.phoneLabel}
              </a>
              <a href={`https://wa.me/${siteConfig.whatsappNumber}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#CDA85F] px-5 py-3 text-sm font-semibold text-[#0D2922] transition hover:brightness-110">
                <MessageCircleMore size={16} />
                {dict.home.appointment.whatsappLabel}
              </a>
              <Link href={getRoutePath("appointment", locale)} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-[#123A30] transition hover:bg-[#DDE9E3]">
                <CalendarDays size={16} />
                {dict.home.appointment.pageLabel}
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
