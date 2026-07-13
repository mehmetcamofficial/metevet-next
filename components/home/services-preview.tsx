import { ArrowRight, Bone, Brain, HeartHandshake, Microscope, ShieldCheck } from "lucide-react";
import Link from "next/link";

const services = [
  {
    title: "Preventive Medicine",
    description: "Wellness exams, vaccination plans, and tailored nutrition guidance.",
    icon: ShieldCheck,
  },
  {
    title: "Diagnostics",
    description: "In-house labs and imaging to identify issues quickly and accurately.",
    icon: Microscope,
  },
  {
    title: "Surgery",
    description: "Gentle, modern procedures with clear recovery support.",
    icon: HeartHandshake,
  },
  {
    title: "Dental & Orthopedic Care",
    description: "Comprehensive care for comfort, mobility, and long-term wellbeing.",
    icon: Bone,
  },
  {
    title: "Neurology & Internal Medicine",
    description: "Specialist-level oversight for complex medical cases.",
    icon: Brain,
  },
];

export function ServicesPreview() {
  return (
    <section id="services" className="px-6 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8b36a]/30 bg-[#0f2d24]/70 px-3 py-1 text-sm font-medium uppercase tracking-[0.28em] text-[#d8b36a]">
              <ShieldCheck size={16} />
              Services
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Medicine designed around comfort, precision, and long-term health.
            </h2>
          </div>
          <Link href="#appointment" className="inline-flex items-center gap-2 text-sm font-semibold text-[#d8b36a]">
            Book a consultation
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article key={service.title} className="group rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.03))] p-6 shadow-[0_15px_45px_rgba(0,0,0,0.16)] transition hover:-translate-y-1 hover:border-[#d8b36a]/35">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f2d24] text-[#d8b36a]">
                  <Icon size={20} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#b8c5be]">{service.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
