"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F4F0E8] px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#CDA85F]">Unexpected issue</p>
      <h1 className="mt-4 text-3xl font-semibold text-[#0D2922] sm:text-4xl">Something went wrong.</h1>
      <p className="mt-4 max-w-xl text-base leading-8 text-[#687A75]">We could not load this page correctly. Please try again or return to the homepage.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={() => reset()} className="rounded-full bg-[#123A30] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
          Try again
        </button>
        <Link href="/tr" className="rounded-full border border-[#123A30]/15 bg-white px-5 py-3 text-sm font-semibold text-[#123A30] transition hover:border-[#123A30]">
          Return home
        </Link>
      </div>
    </main>
  );
}
