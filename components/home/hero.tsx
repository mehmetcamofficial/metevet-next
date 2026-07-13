import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-20 sm:py-24 lg:px-8 lg:py-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(216,179,106,0.16),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(14,42,34,0.8),_transparent_45%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d8b36a]/30 bg-[#102d24]/70 px-3 py-1 text-sm font-medium text-[#f3e1b3]">
            <Sparkles size={16} />
            Premium veterinary medicine for modern pet families
          </div>
          <h1 className="text-4xl font-semibold leading-[0.95] tracking-[-0.03em] text-white sm:text-5xl lg:text-7xl">
            Elevated care for every stage of your pet’s life.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#b8c5be] sm:text-xl">
            Preventive wellness, advanced diagnostics, and compassionate care — all delivered in a calm, luxury medical environment.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#appointment"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d8b36a] px-6 py-3 text-sm font-semibold text-[#081a16] transition hover:scale-[1.01]"
            >
              Make an appointment
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#services"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explore services
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-[#c0d0c8]">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <ShieldCheck size={16} className="text-[#d8b36a]" />
              Same-week appointments
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <Stethoscope size={16} className="text-[#d8b36a]" />
              Science-led treatment plans
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[#d8b36a]/25 to-transparent blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(140deg,_rgba(255,255,255,0.12),_rgba(255,255,255,0.03))] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#d8b36a]">Clinic experience</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Comfort-first veterinary care</h2>
              </div>
              <div className="rounded-full border border-[#d8b36a]/20 bg-[#0f2d24] px-3 py-1 text-sm font-medium text-[#f2e1b5]">
                4.9/5 from pet owners
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-[#081a16] p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Preventive care", "Annual wellness, vaccines, parasite control"],
                  ["Diagnostics", "Advanced imaging and in-house lab testing"],
                  ["Surgery", "Safe, modern procedures with clear aftercare"],
                  ["Dental", "Gentle oral care for enduring health"],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#b8c5be]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
