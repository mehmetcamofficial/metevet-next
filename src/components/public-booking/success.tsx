"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, Home, PawPrint } from "lucide-react";
import type { PublicBookingResult } from "@/src/lib/public-booking/actions";
import type { Locale } from "@/types";

const copy: Record<Locale, Record<string, string>> = {
  tr: {
    pendingTitle: "Randevu Talebiniz Alındı",
    pendingDescription: "Randevu talebiniz başarıyla iletilmiştir. Talebiniz klinik tarafından değerlendirilecek ve onay durumu size bildirilecektir.",
    confirmedTitle: "Randevunuz Oluşturuldu",
    confirmedDescription: "Randevunuz başarıyla oluşturulmuştur. Belirtilen tarih ve saatte kliniğimizde bekleriz.",
    reference: "Referans No",
    service: "Hizmet",
    veterinarian: "Veteriner Hekim",
    dateTime: "Tarih ve Saat",
    firstAvailable: "İlk uygun veteriner",
    returnHome: "Ana Sayfaya Dön",
    clinicContact: "İletişim: WhatsApp üzerinden veya 05XX XXX XX XX numaralı telefondan kliniğe ulaşabilirsiniz.",
    bookingNotice: "Randevunuzun geçerli sayılması için zamanında kliniğe gelmeniz gerekmektedir.",
  },
  en: {
    pendingTitle: "Your Appointment Request Has Been Received",
    pendingDescription: "Your appointment request has been successfully submitted. The clinic will review your request and notify you of the confirmation status.",
    confirmedTitle: "Your Appointment Has Been Created",
    confirmedDescription: "Your appointment has been successfully created. We look forward to seeing you at the clinic at the specified date and time.",
    reference: "Reference No",
    service: "Service",
    veterinarian: "Veterinarian",
    dateTime: "Date & Time",
    firstAvailable: "First available veterinarian",
    returnHome: "Return to Home",
    clinicContact: "Contact: You can reach the clinic via WhatsApp or phone at 05XX XXX XX XX.",
    bookingNotice: "Please arrive at the clinic on time for your appointment to be considered valid.",
  },
};

export function PublicBookingSuccess({
  result,
  locale,
}: {
  result: PublicBookingResult & { ok: true };
  locale: Locale;
}) {
  const text = copy[locale];
  const isPending = result.status === "pending";
  const announceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    announceRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      ref={announceRef}
      tabIndex={-1}
      className="mx-auto max-w-lg outline-none"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-[2rem] border border-[#D1DBD5]/50 bg-white p-8 text-center shadow-[0_15px_40px_rgba(13,41,34,0.07)]">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
            isPending ? "bg-[#FFF8E8]" : "bg-[#DDE9E3]"
          }`}
        >
          <CheckCircle2
            size={40}
            className={isPending ? "text-[#CDA85F]" : "text-[#123A30]"}
          />
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-[#0D2922]">
          {isPending ? text.pendingTitle : text.confirmedTitle}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#687A75]">
          {isPending ? text.pendingDescription : text.confirmedDescription}
        </p>

        {/* Booking details */}
        <div className="mt-8 space-y-3 rounded-2xl border border-[#D1DBD5] bg-[#F4F0E8]/50 p-5 text-left">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="font-medium text-[#687A75]">{text.reference}</dt>
              <dd className="font-mono text-base font-bold text-[#0D2922]">
                {result.reference}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-[#D1DBD5] pt-2">
              <dt className="font-medium text-[#687A75]">{text.service}</dt>
              <dd className="font-medium text-[#0D2922]">
                {locale === "tr" ? result.serviceNameTr : result.serviceNameEn}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-[#D1DBD5] pt-2">
              <dt className="font-medium text-[#687A75]">{text.dateTime}</dt>
              <dd className="font-medium text-[#0D2922]">
                {result.date} {result.time}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-[#D1DBD5] pt-2">
              <dt className="font-medium text-[#687A75]">{text.veterinarian}</dt>
              <dd className="font-medium text-[#0D2922]">
                {result.veterinarianName || text.firstAvailable}
              </dd>
            </div>
          </dl>
        </div>

        {isPending && (
          <p className="mt-4 rounded-xl bg-[#FFF8E8] p-4 text-sm leading-6 text-[#6F531C]">
            {text.clinicContact}
          </p>
        )}

        <p className="mt-4 text-xs leading-5 text-[#95A8A2]">
          {text.bookingNotice}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/${locale}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#123A30] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Home size={16} />
            {text.returnHome}
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#95A8A2]">
          <PawPrint size={14} />
          MeteVet Veteriner Kliniği
        </div>
      </div>
    </div>
  );
}
