import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/home/footer";
import { Navbar } from "@/components/home/navbar";

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
};

export function PageShell({
  eyebrow,
  title,
  description,
  children,
  ctaLabel,
  ctaHref,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-[#081a16] text-white">
      <Navbar />
      <main className="px-6 py-16 sm:py-20 lg:px-8">
        <section className="mx-auto flex max-w-7xl flex-col gap-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.03))] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.2)] lg:flex-row lg:items-end lg:justify-between lg:p-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8b36a]/30 bg-[#0f2d24]/70 px-3 py-1 text-sm font-medium uppercase tracking-[0.28em] text-[#d8b36a]">
              {eyebrow}
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#b8c5be]">{description}</p>
          </div>
          {ctaLabel && ctaHref ? (
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d8b36a] px-6 py-3 text-sm font-semibold text-[#081a16] transition hover:brightness-110"
            >
              {ctaLabel}
              <ArrowRight size={16} />
            </Link>
          ) : null}
        </section>

        <div className="mx-auto mt-10 max-w-7xl">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
