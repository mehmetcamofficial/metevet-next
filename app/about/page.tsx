import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About MeteVet | Premium Veterinary Care",
  description: "Learn about Dr. Onur Metehan Çakır and the philosophy behind premium veterinary care at MeteVet.",
};

const highlights = [
  {
    title: "Preventive-first medicine",
    description: "We prioritize proactive care, education, and prevention so pets can thrive long-term.",
  },
  {
    title: "Thoughtful communication",
    description: "Every visit is designed to feel clear, calm, and deeply informative for pet owners.",
  },
  {
    title: "Modern clinical standards",
    description: "We combine contemporary medical practices with a refined, comfort-led clinic experience.",
  },
];

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About"
      title="A premium veterinary experience shaped by precision and compassion."
      description="MeteVet was created for pet owners who expect more than routine treatment — a calm, modern clinic where expert medicine and thoughtful service meet."
      ctaLabel="Book a consultation"
      ctaHref="/appointment"
    >
      <div className="relative mb-8 aspect-[16/7] overflow-hidden rounded-[2rem] border border-white/10">
        <Image src="/images/clinic/clinic-reception.png" alt="MeteVet clinic reception" fill sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.03))] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#d8b36a]">Our philosophy</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Medicine that feels as refined as it is effective.</h2>
          <p className="mt-5 text-lg leading-8 text-[#b8c5be]">
            Veterinary medicine is not only about treating disease. It is about creating long, healthy lives for pets through preventive medicine, scientific care, and strong communication with the people who love them.
          </p>
          <p className="mt-4 text-lg leading-8 text-[#b8c5be]">
            From the moment you enter, the experience is designed to feel calm, reassuring, and professionally elevated.
          </p>
        </div>

        <div className="space-y-5">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-[#0f2d24]/70 p-6">
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-base leading-7 text-[#b8c5be]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
