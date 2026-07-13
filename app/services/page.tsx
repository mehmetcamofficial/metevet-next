import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { services } from "@/data/site-content";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Services | MeteVet",
  description: "Explore premium veterinary services for wellness, diagnostics, surgery, dentistry, and long-term care.",
};

export default function ServicesPage() {
  return (
    <PageShell
      eyebrow="Services"
      title="Clinical care that combines expertise, comfort, and modern technology."
      description="We offer a full suite of premium veterinary services designed to support every stage of your pet’s health journey."
      ctaLabel="Schedule a visit"
      ctaHref="/appointment"
    >
      <div className="relative mb-8 aspect-[16/7] overflow-hidden rounded-[2rem] border border-white/10">
        <Image src="/images/clinic/clinic-treatment-room.png" alt="MeteVet modern treatment room" fill sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <article key={service.title} className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(145deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.03))] p-8 shadow-[0_15px_45px_rgba(0,0,0,0.16)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d8b36a]">Service</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">{service.title}</h2>
            <p className="mt-4 text-base leading-8 text-[#b8c5be]">{service.description}</p>
            <p className="mt-5 text-sm font-medium text-[#f3e1b3]">{service.blurb}</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
