"use client";

import { useRouter } from "next/navigation";
import { SkipLink } from "@/src/components/shared/skip-link";
import { Navbar } from "@/src/components/layout/navbar";
import { Footer } from "@/src/components/layout/footer";
import type { Locale } from "@/types";

/**
 * This page renders after a successful booking redirect.
 * Since the booking result is stored in the wizard-client state,
 * this page directs the user to return to the wizard if they
 * land here without a booking result (refresh/bookmark).
 *
 * The actual result is shown in the wizard via client-side routing.
 * This page displays a fallback message if accessed directly.
 */

export function PublicBookingSuccessPage({ locale }: { locale: Locale }) {
  const router = useRouter();
  const isTurkish = locale === "tr";

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#0D2922]">
      <SkipLink />
      <Navbar locale={locale} />
      <main id="main-content" className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="rounded-[2rem] border border-[#D1DBD5]/50 bg-white p-8 shadow-[0_15px_40px_rgba(13,41,34,0.07)]">
            <h1 className="text-xl font-semibold text-[#0D2922]">
              {isTurkish
                ? "Randevu talebiniz başarıyla alındı."
                : "Your appointment request has been received."}
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#687A75]">
              {isTurkish
                ? "Sayfayı yenilediyseniz, detaylar için lütfen ana sayfaya dönün veya yeni bir randevu oluşturun."
                : "If you refreshed the page, please return to the home page or create a new appointment for details."}
            </p>
            <button
              type="button"
              onClick={() => router.push(`/${locale}`)}
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#123A30] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              {isTurkish ? "Ana Sayfaya Dön" : "Return to Home"}
            </button>
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
