import { ArrowUpRight, MapPin, Phone, Send } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer id="contact" className="px-6 pb-10 pt-4 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.03))] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.2)] lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.7fr_0.7fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d8b36a]">MeteVet</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Premium veterinary care, tailored to your pet’s needs.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#b8c5be]">
              We combine medical precision with a calm, design-led experience to support healthy, happy lives for pets and the people who love them.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Visit us</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#dce7e1]">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 text-[#d8b36a]" />
                İstanbul, Turkey
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-[#d8b36a]" />
                +90 500 000 00 00
              </li>
              <li className="flex items-center gap-2">
                <Send size={16} className="text-[#d8b36a]" />
                hello@metevet.com
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Quick links</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#dce7e1]">
              <li><Link href="#about" className="transition hover:text-white">About</Link></li>
              <li><Link href="#services" className="transition hover:text-white">Services</Link></li>
              <li><Link href="#doctor" className="transition hover:text-white">Doctor</Link></li>
              <li><Link href="#appointment" className="transition hover:text-white">Appointment</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-[#9eb1a8] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 MeteVet. All rights reserved.</p>
          <Link href="#top" className="inline-flex items-center gap-2 font-medium text-[#d8b36a]">
            Back to top
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
