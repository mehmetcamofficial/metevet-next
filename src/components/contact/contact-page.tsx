import { CalendarDays, Clock, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/src/components/shared/breadcrumbs";
import { Footer } from "@/src/components/layout/footer";
import { Navbar } from "@/src/components/layout/navbar";
import { SkipLink } from "@/src/components/shared/skip-link";
import { getRoutePath } from "@/src/lib/routes";
import type { Locale } from "@/types";

const phone = "+90 506 585 91 55";
const phoneHref = "tel:+905065859155";
const whatsappHref = "https://wa.me/905065859155";
const mapsHref = "https://maps.app.goo.gl/1J8PFRqAMSpetLjN7";

const copy = {
  tr: {
    breadcrumb: "İletişim",
    eyebrow: "İletişim",
    heading: "MeteVet Veteriner Kliniği ile iletişime geçin.",
    description: "Sorularınız ve randevu talepleriniz için Veteriner Hekim Onur Metehan Çakır'a telefon veya WhatsApp üzerinden ulaşabilirsiniz.",
    phone: "Telefon",
    whatsapp: "WhatsApp",
    whatsappAction: "WhatsApp'tan yazın",
    location: "Konum",
    locationValue: "Kuşadası / Aydın",
    addressNote: "Tam klinik adresi yakında eklenecektir.",
    hours: "Çalışma Saatleri",
    hoursNote: "Çalışma saatleri yakında duyurulacaktır.",
    directions: "Google Maps'te yol tarifi alın",
    appointment: "Randevu Al",
  },
  en: {
    breadcrumb: "Contact",
    eyebrow: "Contact",
    heading: "Contact MeteVet Veterinary Clinic.",
    description: "For questions and appointment requests, contact Veterinarian Onur Metehan Çakır by phone or WhatsApp.",
    phone: "Phone",
    whatsapp: "WhatsApp",
    whatsappAction: "Message on WhatsApp",
    location: "Location",
    locationValue: "Kuşadası / Aydın",
    addressNote: "The full clinic address will be added soon.",
    hours: "Opening Hours",
    hoursNote: "Opening hours will be announced soon.",
    directions: "Get directions on Google Maps",
    appointment: "Book an Appointment",
  },
} as const;

export function ContactPage({ locale }: { locale: Locale }) {
  const text = copy[locale];

  const cards = [
    {
      title: text.phone,
      value: phone,
      icon: Phone,
      href: phoneHref,
    },
    {
      title: text.whatsapp,
      value: text.whatsappAction,
      icon: MessageCircle,
      href: whatsappHref,
      external: true,
    },
    {
      title: text.location,
      value: text.locationValue,
      note: text.addressNote,
      icon: MapPin,
    },
    {
      title: text.hours,
      value: text.hoursNote,
      icon: Clock,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#0D2922]">
      <SkipLink />
      <Navbar locale={locale} />
      <main id="main-content" className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs
            items={[
              { label: locale === "tr" ? "Ana Sayfa" : "Home", href: getRoutePath("home", locale) },
              { label: text.breadcrumb },
            ]}
          />

          <section className="mt-8 rounded-[2rem] border border-[#0D2922]/10 bg-white p-8 shadow-[0_20px_60px_rgba(13,41,34,0.08)] lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{text.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">{text.heading}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#687A75]">{text.description}</p>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {cards.map((card) => {
                const Icon = card.icon;
                const content = (
                  <>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DDE9E3] text-[#123A30]">
                      <Icon size={19} />
                    </div>
                    <h2 className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-[#CDA85F]">{card.title}</h2>
                    <p className="mt-3 text-lg font-semibold text-[#0D2922]">{card.value}</p>
                    {card.note ? <p className="mt-2 text-sm leading-7 text-[#687A75]">{card.note}</p> : null}
                  </>
                );

                return card.href ? (
                  <a
                    key={card.title}
                    href={card.href}
                    target={card.external ? "_blank" : undefined}
                    rel={card.external ? "noopener noreferrer" : undefined}
                    className="rounded-[1.5rem] border border-[#0D2922]/10 bg-[#F4F0E8] p-6 transition hover:border-[#123A30]/30"
                  >
                    {content}
                  </a>
                ) : (
                  <article key={card.title} className="rounded-[1.5rem] border border-[#0D2922]/10 bg-[#F4F0E8] p-6">
                    {content}
                  </article>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#123A30]/15 bg-white px-5 py-3 text-sm font-semibold text-[#123A30] transition hover:border-[#123A30]"
              >
                <Navigation size={16} />
                {text.directions}
              </a>
              <Link
                href={getRoutePath("appointment", locale)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#123A30] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                <CalendarDays size={16} />
                {text.appointment}
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
