import type { Metadata } from "next";
import { MapPin, MessageCircleMore, Phone, Send } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";

export const metadata: Metadata = {
  title: "Contact | MeteVet",
  description: "Contact MeteVet for appointments, questions, or premium veterinary guidance.",
};

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Reach out for thoughtful, premium veterinary support."
      description="We are here to help you book a visit, ask a question, or arrange a consultation for your pet."
      ctaLabel="Call now"
      ctaHref="tel:+905000000000"
    >
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.03))] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
          <h2 className="text-3xl font-semibold text-white">Contact details</h2>
          <div className="mt-6 space-y-4 text-base leading-8 text-[#b8c5be]">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 text-[#d8b36a]" size={18} />
              <span>İstanbul, Turkey</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-[#d8b36a]" size={18} />
              <span>+90 500 000 00 00</span>
            </div>
            <div className="flex items-center gap-3">
              <Send className="text-[#d8b36a]" size={18} />
              <span>hello@metevet.com</span>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="https://wa.me/905000000000" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d8b36a] px-5 py-3 text-sm font-semibold text-[#081a16] transition hover:brightness-110">
              <MessageCircleMore size={16} />
              Message on WhatsApp
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#0f2d24]/70 p-8 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
          <form className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#d8b36a]">Your name</label>
                <input className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none" placeholder="Name" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#d8b36a]">Email</label>
                <input className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none" placeholder="Email" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#d8b36a]">How can we help?</label>
              <textarea className="min-h-32 w-full rounded-[1.25rem] border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none" placeholder="I would like to ask about a treatment plan..." />
            </div>
            <button className="rounded-full bg-[#d8b36a] px-5 py-3 text-sm font-semibold text-[#081a16] transition hover:brightness-110">
              Send message
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
