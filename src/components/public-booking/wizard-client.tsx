"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PublicBookingWizard } from "@/src/components/public-booking/wizard";
import { PublicBookingSuccess } from "@/src/components/public-booking/success";
import { getPublicAvailability } from "@/src/lib/public-booking/availability";
import { submitPublicBooking } from "@/src/lib/public-booking/actions";
import type { PublicService, PublicVeterinarian, PublicBookingRules, PublicAvailabilitySlot } from "@/src/lib/public-booking/availability";
import type { PublicBookingResult } from "@/src/lib/public-booking/actions";
import type { Locale } from "@/types";

export function PublicBookingWizardClient({
  locale,
  services,
  veterinarians,
  rules,
}: {
  locale: Locale;
  services: PublicService[];
  veterinarians: PublicVeterinarian[];
  rules: PublicBookingRules | null;
}) {
  const router = useRouter();
  const [bookingResult, setBookingResult] = useState<(PublicBookingResult & { ok: true }) | null>(null);

  // Wrap server actions as stable callbacks
  const handleAvailability = useCallback(async (
    serviceId: string,
    date: string,
    veterinarianId?: string,
  ): Promise<PublicAvailabilitySlot[]> => {
    const result = await getPublicAvailability(serviceId, date, veterinarianId);
    if (result.ok) return result.slots;
    return [];
  }, []);

  const handleSubmit = useCallback(async (
    payload: Record<string, unknown>,
  ): Promise<PublicBookingResult> => {
    // Convert the generic payload to the typed payload
    const result = await submitPublicBooking(
      {
        serviceId: payload.serviceId as string,
        veterinarianId: payload.veterinarianId as string | undefined,
        date: payload.date as string,
        time: payload.time as string,
        fullName: payload.fullName as string,
        phone: payload.phone as string,
        email: payload.email as string | undefined,
        petName: payload.petName as string,
        species: payload.species as string,
        breed: payload.breed as string | undefined,
        birthDate: payload.birthDate as string | undefined,
        note: payload.note as string | undefined,
        consentPrivacy: payload.consentPrivacy as boolean,
        consentMarketing: payload.consentMarketing as boolean,
        honeypot: payload.honeypot as string,
        turnstileToken: payload.turnstileToken as string | undefined,
      },
      locale,
    );
    return result;
  }, [locale]);

  const handleSuccess = useCallback((result: PublicBookingResult) => {
    if (result.ok) {
      setBookingResult(result as PublicBookingResult & { ok: true });
      // Update URL to success state (client-side, no reload)
      const successPath = locale === "tr" ? "/tr/randevu/basarili" : "/en/appointment/success";
      router.replace(successPath, { scroll: false });
    }
  }, [locale, router]);

  // If booking was successful, show success screen
  if (bookingResult) {
    return <PublicBookingSuccess result={bookingResult} locale={locale} />;
  }

  return (
    <PublicBookingWizard
      locale={locale}
      services={services}
      veterinarians={veterinarians}
      rules={rules}
      onAvailability={handleAvailability}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
    />
  );
}
