import { ArrowRight, CalendarDays, MessageCircleMore } from "lucide-react";
import Link from "next/link";

export function AppointmentCTA() {
  return (
    <section id="appointment" className="px-6 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#d8b36a]/20 bg-[linear-gradient(135deg,_rgba(216,179,106,0.2),_rgba(14,42,34,0.95))] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.25)] lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8b36a]/30 bg-[#0f2d24]/60 px-3 py-1 text-sm font-medium uppercase tracking-[0.28em] text-[#d8b36a]">
              <CalendarDays size={16} />
              Appointment
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Schedule a visit with thoughtful, modern veterinary care.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-8 text-[#dce7e1]">
              Whether it is a routine wellness exam or a more complex concern, our team is here to guide you with calm, expert care.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-[#081a16]/70 p-6 backdrop-blur-xl">
            <form className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#d8b36a]">Your name</label>
                  <input className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none ring-0" placeholder="Name" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#d8b36a]">Pet type</label>
                  <input className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none ring-0" placeholder="Dog / Cat / Other" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#d8b36a]">Email or phone</label>
                <input className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none ring-0" placeholder="contact@example.com" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#d8b36a]">Tell us about your visit</label>
                <textarea className="min-h-28 w-full rounded-[1.25rem] border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none ring-0" placeholder="I’d like to schedule a wellness exam for my pet..." />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d8b36a] px-5 py-3 text-sm font-semibold text-[#081a16] transition hover:brightness-110">
                  Request appointment
                  <ArrowRight size={16} />
                </button>
                <Link href="https://wa.me/905000000000" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8b36a]/30 bg-[#0f2d24] px-5 py-3 text-sm font-semibold text-[#f3e1b3] transition hover:border-[#d8b36a]">
                  <MessageCircleMore size={16} />
                  WhatsApp us
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
