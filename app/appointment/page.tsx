import type { Metadata } from "next";
import { CalendarDays, MessageCircleMore } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";

export const metadata: Metadata = {
  title: "Appointment | MeteVet",
  description: "Request an appointment with MeteVet for wellness visits, diagnostics, or specialist guidance.",
};

export default function AppointmentPage() {
  return (
    <PageShell
      eyebrow="Appointment"
      title="Reserve a visit with a clinic built around comfort and confidence."
      description="Whether you are planning a wellness check or need guidance for an urgent concern, we are ready to help."
      ctaLabel="WhatsApp us"
      ctaHref="https://wa.me/905000000000"
    >
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.03))] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d8b36a]/30 bg-[#0f2d24]/70 px-3 py-1 text-sm font-medium uppercase tracking-[0.28em] text-[#d8b36a]">
            <CalendarDays size={16} />
            Visit planning
          </div>
          <h2 className="mt-5 text-3xl font-semibold text-white">What to expect</h2>
          <ul className="mt-6 space-y-4 text-base leading-8 text-[#b8c5be]">
            <li>• A personalized consultation based on your pet’s history and needs</li>
            <li>• A calm, modern clinic experience with thorough explanations</li>
            <li>• Clear treatment options, follow-up advice, and proactive planning</li>
          </ul>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#0f2d24]/70 p-8 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
          <form className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#d8b36a]">Your name</label>
                <input className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none" placeholder="Name" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#d8b36a]">Pet type</label>
                <input className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none" placeholder="Dog / Cat / Other" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#d8b36a]">Email or phone</label>
              <input className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none" placeholder="contact@example.com" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#d8b36a]">Preferred time</label>
              <input className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none" placeholder="Monday afternoon" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#d8b36a]">Tell us about your visit</label>
              <textarea className="min-h-32 w-full rounded-[1.25rem] border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none" placeholder="I would like to schedule a wellness visit for my pet..." />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d8b36a] px-5 py-3 text-sm font-semibold text-[#081a16] transition hover:brightness-110">
                Request appointment
              </button>
              <Link href="https://wa.me/905000000000" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8b36a]/30 bg-[#0f2d24] px-5 py-3 text-sm font-semibold text-[#f3e1b3] transition hover:border-[#d8b36a]">
                <MessageCircleMore size={16} />
                Chat on WhatsApp
              </Link>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
