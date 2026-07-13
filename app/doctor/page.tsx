import type { Metadata } from "next";
import { GraduationCap, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import Image from "next/image";
import { PageShell } from "@/components/site/page-shell";
import { doctorDetails } from "@/data/site-content";

export const metadata: Metadata = {
  title: "Doctor | MeteVet",
  description: "Meet Dr. Onur Metehan Çakır and learn about his clinical background, credentials, and philosophy.",
};

export default function DoctorPage() {
  return (
    <PageShell
      eyebrow="Doctor"
      title="A clinician committed to long-term wellbeing and attentive care."
      description="Dr. Onur Metehan Çakır brings a preventive-first philosophy and a modern, compassionate approach to veterinary medicine."
      ctaLabel="Ask about care plans"
      ctaHref="/appointment"
    >
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f2d24] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
            <Image
              src="/images/onur-metehan-cakir.jpg"
              alt="Dr. Onur Metehan Çakır"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.03))] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8b36a]/30 bg-[#0f2d24]/70 px-3 py-1 text-sm font-medium uppercase tracking-[0.28em] text-[#d8b36a]">
              <Stethoscope size={16} />
              Clinical profile
            </div>
            <h2 className="mt-5 text-3xl font-semibold text-white">Dr. Onur Metehan Çakır</h2>
            <p className="mt-4 text-lg leading-8 text-[#b8c5be]">
              Veterinary medicine is about creating a long and healthy life for every pet through preventive medicine, scientific care, and strong communication with pet owners.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {doctorDetails.map((detail) => (
              <div key={detail.title} className="rounded-[1.5rem] border border-white/10 bg-[#0f2d24]/70 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d8b36a]">{detail.title}</p>
                <p className="mt-3 text-base leading-7 text-[#dce7e1]">{detail.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#0f2d24]/70 p-6">
              <GraduationCap className="text-[#d8b36a]" size={20} />
              <h3 className="mt-4 text-xl font-semibold text-white">Training Philosophy</h3>
              <p className="mt-3 text-base leading-7 text-[#b8c5be]">A calm, evidence-based approach that gives owners clarity and pets comfort.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-[#0f2d24]/70 p-6">
              <HeartPulse className="text-[#d8b36a]" size={20} />
              <h3 className="mt-4 text-xl font-semibold text-white">Patient Experience</h3>
              <p className="mt-3 text-base leading-7 text-[#b8c5be]">Compassionate support for both pets and their families throughout every stage of care.</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#d8b36a]/20 bg-[#0f2d24]/70 p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-[#d8b36a]" size={20} />
              <p className="text-base leading-8 text-[#dce7e1]">
                Every plan is built around prevention, clear explanations, and a tailored path for long-term health.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
