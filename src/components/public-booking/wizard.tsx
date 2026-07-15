"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Info,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { PublicService, PublicVeterinarian, PublicBookingRules, PublicAvailabilitySlot } from "@/src/lib/public-booking/availability";
import type { PublicBookingResult } from "@/src/lib/public-booking/actions";
import type { Locale } from "@/types";
import { TurnstileWidget } from "@/src/components/public-booking/turnstile-widget";

// ── Translation map ──

const translations: Record<Locale, Record<string, string>> = {
  tr: {
    step1: "Hizmet",
    step2: "Tarih ve Saat",
    step3: "Bilgiler",
    step4: "Onay",
    step1Title: "Hizmet Seçin",
    step2Title: "Tarih ve Saat Seçin",
    step3Title: "İletişim ve Hayvan Bilgileri",
    step4Title: "Özet ve Onay",
    selectService: "Lütfen bir hizmet seçin",
    selectVet: "Veteriner Hekim",
    firstAvailable: "İlk uygun veteriner",
    selectDate: "Tarih Seçin",
    selectTime: "Saat Seçin",
    noSlots: "Seçilen tarih için uygun slot bulunamadı.",
    slotsLoading: "Slotlar yükleniyor...",
    slotsError: "Slotlar yüklenirken bir hata oluştu.",
    slotExpiry: "Slot gösterim amaçlıdır; gönderim sırasında saat yeniden kontrol edilir.",
    fullName: "Ad Soyad",
    phone: "Telefon",
    email: "E-posta",
    optional: "İsteğe bağlı",
    petName: "Hayvan Adı",
    species: "Hayvan Türü",
    breed: "Irk",
    birthDate: "Doğum Tarihi",
    note: "Randevu Notu",
    noteHint: "İsteğe bağlı kısa not (en fazla 500 karakter)",
    privacyConsent: "Kişisel verilerimin randevu talebi amacıyla işlenmesine ilişkin KVKK onayını kabul ediyorum.",
    marketingConsent: "Pazarlama ve bilgilendirme amaçlı iletişime izin veriyorum.",
    summaryService: "Hizmet",
    summaryVet: "Veteriner",
    summaryDateTime: "Tarih ve Saat",
    summaryDuration: "Süre",
    summaryOwner: "Sahip",
    summaryPet: "Hayvan",
    summaryContact: "İletişim",
    summaryNoVet: "İlk uygun veteriner",
    submitWarning: "Gönderim sırasında saat yeniden kontrol edilir. Bu ekran tek başına rezervasyon garantisi oluşturmaz.",
    submit: "Randevu Talebi Oluştur",
    submitting: "Gönderiliyor...",
    invalidPhone: "Geçerli bir telefon numarası giriniz.",
    invalidEmail: "Geçerli bir e-posta adresi giriniz.",
    required: "Bu alan zorunludur.",
    privacyRequired: "KVKK onayı gereklidir.",
    back: "Geri",
    next: "İleri",
    minutes: "dk",
    chooseSpecies: "Tür Seçin",
    speciesOptions: "Kedi,Köpek,Kuş,Egzotik,Diğer",
    morning: "Sabah",
    afternoon: "Öğleden Sonra",
    evening: "Akşam",
    refresh: "Slotları Yenile",
    dateBoundsNotice: "Gelecek bir tarih seçin.",
    selectTimeFirst: "Önce bir saat seçin",
  },
  en: {
    step1: "Service",
    step2: "Date & Time",
    step3: "Details",
    step4: "Review",
    step1Title: "Select a Service",
    step2Title: "Select Date & Time",
    step3Title: "Contact & Pet Details",
    step4Title: "Review & Confirm",
    selectService: "Please select a service",
    selectVet: "Veterinarian",
    firstAvailable: "First available veterinarian",
    selectDate: "Select Date",
    selectTime: "Select Time",
    noSlots: "No available slots found for the selected date.",
    slotsLoading: "Loading slots...",
    slotsError: "An error occurred while loading slots.",
    slotExpiry: "Slots are advisory; the time is revalidated at submission.",
    fullName: "Full Name",
    phone: "Phone",
    email: "Email",
    optional: "Optional",
    petName: "Pet Name",
    species: "Species",
    breed: "Breed",
    birthDate: "Birth Date",
    note: "Appointment Note",
    noteHint: "Optional brief note (max 500 characters)",
    privacyConsent: "I consent to the processing of my personal data for the purpose of this appointment request.",
    marketingConsent: "I allow marketing and informational communication.",
    summaryService: "Service",
    summaryVet: "Veterinarian",
    summaryDateTime: "Date & Time",
    summaryDuration: "Duration",
    summaryOwner: "Owner",
    summaryPet: "Pet",
    summaryContact: "Contact",
    summaryNoVet: "First available veterinarian",
    submitWarning: "The time is revalidated at submission. This screen alone does not guarantee a reservation.",
    submit: "Submit Appointment Request",
    submitting: "Submitting...",
    invalidPhone: "Please enter a valid phone number.",
    invalidEmail: "Please enter a valid email address.",
    required: "This field is required.",
    privacyRequired: "Privacy consent is required.",
    back: "Back",
    next: "Next",
    minutes: "min",
    chooseSpecies: "Choose Species",
    speciesOptions: "Cat,Dog,Bird,Exotic,Other",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    refresh: "Refresh Slots",
    dateBoundsNotice: "Please select a future date.",
    selectTimeFirst: "Select a time first",
  },
};

function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? key;
}

// ── Helpers ──

function getIstanbulToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function groupSlotsByPeriod(slots: PublicAvailabilitySlot[]): Record<string, PublicAvailabilitySlot[]> {
  const groups: Record<string, PublicAvailabilitySlot[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  for (const slot of slots) {
    const hour = parseInt(slot.displayTime.split(":")[0], 10);
    if (hour < 12) groups.morning.push(slot);
    else if (hour < 17) groups.afternoon.push(slot);
    else groups.evening.push(slot);
  }

  return groups;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return phone;
  return phone.slice(0, -4) + "****";
}

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return email;
  return email[0] + "****" + email.slice(at);
}

// ── Species list ──

const SPECIES_OPTIONS_TR = ["Kedi", "Köpek", "Kuş", "Egzotik", "Diğer"];
const SPECIES_OPTIONS_EN = ["Cat", "Dog", "Bird", "Exotic", "Other"];

// ── Props ──

type WizardProps = {
  locale: Locale;
  services: PublicService[];
  veterinarians: PublicVeterinarian[];
  rules: PublicBookingRules | null;
  onAvailability: (serviceId: string, date: string, veterinarianId?: string) => Promise<PublicAvailabilitySlot[]>;
  onSubmit: (payload: Record<string, unknown>) => Promise<PublicBookingResult>;
  onSuccess: (result: PublicBookingResult) => void;
};

// ── Step indicator ──

function StepIndicator({ current, locale }: { current: number; locale: Locale }) {
  const steps = [t(locale, "step1"), t(locale, "step2"), t(locale, "step3"), t(locale, "step4")];
  return (
    <nav aria-label={locale === "tr" ? "Adımlar" : "Steps"} className="mb-8">
      <ol className="flex items-center gap-2 sm:gap-4">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === current;
          const isDone = stepNum < current;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-[#123A30] text-white"
                    : isDone
                      ? "bg-[#DDE9E3] text-[#123A30]"
                      : "border border-[#D1DBD5] text-[#95A8A2]"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {isDone ? <Check size={16} /> : stepNum}
              </span>
              <span className={`hidden text-sm font-medium sm:inline ${isActive ? "text-[#123A30]" : "text-[#687A75]"}`}>
                {label}
              </span>
              {i < steps.length - 1 && <div className="mx-1 h-px w-6 bg-[#D1DBD5] sm:w-8" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Slot time button ──

function SlotButton({
  slot,
  selected,
  onSelect,
}: {
  slot: PublicAvailabilitySlot;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${slot.displayTime} - ${slot.veterinarianName}`}
      className={`min-h-11 min-w-[4.5rem] rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30 ${
        selected
          ? "border-[#123A30] bg-[#123A30] text-white shadow"
          : "border-[#D1DBD5] bg-white text-[#0D2922] hover:border-[#123A30] hover:bg-[#DDE9E3]/50"
      }`}
    >
      {slot.displayTime}
    </button>
  );
}

// ── Main Wizard Component ──

export function PublicBookingWizard({
  locale,
  services,
  veterinarians,
  rules,
  onAvailability,
  onSubmit,
  onSuccess,
}: WizardProps) {
  // State
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [selectedVet, setSelectedVet] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<PublicAvailabilitySlot | null>(null);
  const [slots, setSlots] = useState<PublicAvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    petName: "",
    species: "",
    breed: "",
    birthDate: "",
    note: "",
  });
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  // Refs for accessibility
  const topRef = useRef<HTMLDivElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  // Get Istanbul min/max date for date input
  const today = getIstanbulToday();
  const minDate = rules?.minimumNoticeMinutes && rules.minimumNoticeMinutes > 0
    ? today
    : today;
  const maxDate = rules?.maximumAdvanceDays
    ? new Date(new Date(today).getTime() + rules.maximumAdvanceDays * 86400000)
        .toISOString()
        .slice(0, 10)
    : "";

  // Scroll to top on step change
  useEffect(() => {
    topRef.current?.focus({ preventScroll: true });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  // Announce changes to screen readers
  useEffect(() => {
    if (announceRef.current) {
      announceRef.current.textContent = `${t(locale, `step${step}Title`)}`;
    }
  }, [step, locale]);

  // Fetch slots when service/date/vet changes
  useEffect(() => {
    if (!selectedService || !selectedDate) return;

    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const result = await onAvailability(selectedService.id, selectedDate, selectedVet || undefined);
        setSlots(result);

        // If the previously selected slot is no longer available, clear it
        if (selectedSlot) {
          const stillAvailable = result.some(
            (s) => s.displayTime === selectedSlot.displayTime && s.veterinarianId === selectedSlot.veterinarianId,
          );
          if (!stillAvailable) {
            setSelectedSlot(null);
          }
        }
      } catch {
        setSlotsError(t(locale, "slotsError"));
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [selectedService, selectedDate, selectedVet, onAvailability, locale, selectedSlot]);

  // Validate step
  const validateStep = (s: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (s === 1 && !selectedService) {
      newErrors.service = t(locale, "required");
    }
    if (s === 2) {
      if (!selectedDate) newErrors.date = t(locale, "required");
      if (!selectedSlot) newErrors.time = t(locale, "required");
    }
    if (s === 3) {
      if (!formData.fullName.trim()) newErrors.fullName = t(locale, "required");
      if (!formData.phone.trim()) {
        newErrors.phone = t(locale, "required");
      } else if (formData.phone.replace(/\D/g, "").length < 8) {
        newErrors.phone = t(locale, "invalidPhone");
      }
      if (!formData.petName.trim()) newErrors.petName = t(locale, "required");
      if (!formData.species) newErrors.species = t(locale, "required");
      if (!consentPrivacy) newErrors.consentPrivacy = t(locale, "privacyRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToStep = (s: number) => {
    if (s > step && !validateStep(step)) return;
    setStep(s);
    setErrors({});
    setSubmitError(null);
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    if (!selectedService || !selectedSlot) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await onSubmit({
        serviceId: selectedService.id,
        veterinarianId: selectedVet,
        date: selectedDate,
        time: selectedSlot.displayTime,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        petName: formData.petName.trim(),
        species: formData.species,
        breed: formData.breed.trim() || undefined,
        birthDate: formData.birthDate || undefined,
        note: formData.note.trim() || undefined,
        consentPrivacy,
        consentMarketing,
        honeypot: "",
        turnstileToken: turnstileToken || undefined,
        locale,
      });

      if (result.ok) {
        setTurnstileToken(null);
        setTurnstileError(null);
        onSuccess(result);
      } else {
        setSubmitError(result.reason);
        setTurnstileToken(null);
      }
    } catch {
      setSubmitError(t(locale, "An error occurred. Please try again."));
      setTurnstileToken(null);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 1: Service Selection ──

  const renderStep1 = () => (
    <div className="space-y-4" role="radiogroup" aria-label={t(locale, "step1Title")}>
      {errors.service && (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
          {errors.service}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((svc) => {
          const isSelected = selectedService?.id === svc.id;
          return (
            <button
              key={svc.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelectedService(svc)}
              className={`rounded-2xl border-2 p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30 ${
                isSelected
                  ? "border-[#123A30] bg-[#DDE9E3] shadow"
                  : "border-[#D1DBD5] bg-white hover:border-[#123A30] hover:bg-[#DDE9E3]/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#0D2922]">
                    {locale === "tr" ? svc.nameTr : svc.nameEn}
                  </h3>
                  {(locale === "tr" ? svc.descriptionTr : svc.descriptionEn) && (
                    <p className="mt-1 text-sm leading-5 text-[#687A75]">
                      {locale === "tr" ? svc.descriptionTr : svc.descriptionEn}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#123A30]">
                    <Check size={14} className="text-white" />
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#95A8A2]">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#D1DBD5] px-2 py-0.5">
                  <Clock size={12} />
                  {svc.durationMinutes} {t(locale, "minutes")}
                </span>
                {svc.requiresManualConfirmation && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8E8] px-2 py-0.5 text-[#6F531C]">
                    <Info size={12} />
                    {locale === "tr" ? "Onay gerekli" : "Confirmation required"}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Step 2: Date & Time Selection ──

  const renderStep2 = () => {
    const grouped = groupSlotsByPeriod(slots);

    return (
      <div className="space-y-6">
        {errors.date && (
          <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
            {errors.date}
          </p>
        )}

        {/* Veterinarian selection */}
        {veterinarians.length > 1 && rules?.allowFirstAvailableVeterinarian !== false && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[#123A30]">
              {t(locale, "selectVet")}
            </legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                role="radio"
                aria-checked={selectedVet === null}
                onClick={() => setSelectedVet(null)}
                className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30 ${
                  selectedVet === null
                    ? "border-[#123A30] bg-[#123A30] text-white"
                    : "border-[#D1DBD5] bg-white text-[#0D2922] hover:border-[#123A30]"
                }`}
              >
                {t(locale, "firstAvailable")}
              </button>
              {veterinarians.map((vet) => (
                <button
                  key={vet.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedVet === vet.id}
                  onClick={() => setSelectedVet(vet.id)}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30 ${
                    selectedVet === vet.id
                      ? "border-[#123A30] bg-[#123A30] text-white"
                      : "border-[#D1DBD5] bg-white text-[#0D2922] hover:border-[#123A30]"
                  }`}
                >
                  {vet.fullName}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* Date picker */}
        <div>
          <label htmlFor="booking-date" className="mb-2 block text-sm font-medium text-[#123A30]">
            {t(locale, "selectDate")}
          </label>
          <input
            id="booking-date"
            type="date"
            min={minDate}
            max={maxDate || undefined}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-xl border border-[#D1DBD5] bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30] focus:ring-2 focus:ring-[#123A30]/15"
            aria-describedby="date-hint"
          />
          <p id="date-hint" className="mt-1 text-xs text-[#95A8A2]">
            {t(locale, "dateBoundsNotice")}
          </p>
        </div>

        {/* Slot times */}
        {selectedDate && (
          <div aria-live="polite" aria-atomic="true">
            {slotsLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#687A75]">
                <RefreshCw size={16} className="animate-spin" />
                {t(locale, "slotsLoading")}
              </div>
            ) : slotsError ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
                {slotsError}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedService && selectedDate) {
                      onAvailability(selectedService.id, selectedDate, selectedVet || undefined)
                        .then(setSlots)
                        .catch(() => setSlotsError(t(locale, "slotsError")));
                    }
                  }}
                  className="ml-2 underline"
                >
                  {t(locale, "refresh")}
                </button>
              </p>
            ) : slots.length === 0 && selectedDate >= today ? (
              <div className="rounded-2xl border-2 border-dashed border-[#D1DBD5] p-8 text-center">
                <CalendarDays size={32} className="mx-auto text-[#95A8A2]" />
                <p className="mt-3 text-sm text-[#687A75]">{t(locale, "noSlots")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {errors.time && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
                    {errors.time}
                  </p>
                )}
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-[#123A30]">
                    {t(locale, "selectTime")}
                  </legend>
                  {Object.entries(grouped).map(([period, periodSlots]) => {
                    if (periodSlots.length === 0) return null;
                    return (
                      <div key={period} className="mb-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#95A8A2]">
                          {t(locale, period)}
                        </p>
                        <div
                          className="flex flex-wrap gap-2"
                          role="radiogroup"
                          aria-label={t(locale, period)}
                        >
                          {periodSlots.map((slot) => (
                            <SlotButton
                              key={`${slot.veterinarianId}-${slot.displayTime}`}
                              slot={slot}
                              selected={selectedSlot?.displayTime === slot.displayTime && selectedSlot?.veterinarianId === slot.veterinarianId}
                              onSelect={() => setSelectedSlot(slot)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </fieldset>

                <p className="flex items-start gap-2 rounded-xl bg-[#FFF8E8] p-3 text-xs leading-5 text-[#6F531C]">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  {t(locale, "slotExpiry")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Step 3: Contact & Pet Info ──

  const renderStep3 = () => {
    const speciesOptions = locale === "tr" ? SPECIES_OPTIONS_TR : SPECIES_OPTIONS_EN;

    return (
      <div className="space-y-6">
        {submitError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
            {submitError}
          </p>
        )}

        {/* Contact information */}
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-[#0D2922]">
            {locale === "tr" ? "İletişim Bilgileri" : "Contact Information"}
          </legend>

          <div>
            <label htmlFor="wf-fullName" className="mb-1.5 block text-sm font-medium text-[#123A30]">
              {t(locale, "fullName")} <span className="text-red-700">*</span>
            </label>
            <input
              id="wf-fullName"
              name="fullName"
              autoComplete="name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "wf-fullName-error" : undefined}
              className="w-full rounded-xl border border-[#D1DBD5] bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30] focus:ring-2 focus:ring-[#123A30]/15"
            />
            {errors.fullName && (
              <p id="wf-fullName-error" className="mt-1 text-sm text-red-700" role="alert">
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wf-phone" className="mb-1.5 block text-sm font-medium text-[#123A30]">
                {t(locale, "phone")} <span className="text-red-700">*</span>
              </label>
              <input
                id="wf-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+90 5XX XXX XX XX"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "wf-phone-error" : undefined}
                className="w-full rounded-xl border border-[#D1DBD5] bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30] focus:ring-2 focus:ring-[#123A30]/15"
              />
              {errors.phone && (
                <p id="wf-phone-error" className="mt-1 text-sm text-red-700" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="wf-email" className="mb-1.5 block text-sm font-medium text-[#123A30]">
                {t(locale, "email")} {rules?.requireEmail && <span className="text-red-700">*</span>}
                {!rules?.requireEmail && (
                  <span className="text-[#95A8A2]"> ({t(locale, "optional")})</span>
                )}
              </label>
              <input
                id="wf-email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-[#D1DBD5] bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30] focus:ring-2 focus:ring-[#123A30]/15"
              />
            </div>
          </div>
        </fieldset>

        {/* Pet information */}
        <fieldset className="space-y-4 border-t border-[#D1DBD5] pt-6">
          <legend className="text-base font-semibold text-[#0D2922]">
            {locale === "tr" ? "Hayvan Bilgileri" : "Pet Information"}
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wf-petName" className="mb-1.5 block text-sm font-medium text-[#123A30]">
                {t(locale, "petName")} <span className="text-red-700">*</span>
              </label>
              <input
                id="wf-petName"
                name="petName"
                value={formData.petName}
                onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                aria-invalid={!!errors.petName}
                aria-describedby={errors.petName ? "wf-petName-error" : undefined}
                className="w-full rounded-xl border border-[#D1DBD5] bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30] focus:ring-2 focus:ring-[#123A30]/15"
              />
              {errors.petName && (
                <p id="wf-petName-error" className="mt-1 text-sm text-red-700" role="alert">
                  {errors.petName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="wf-species" className="mb-1.5 block text-sm font-medium text-[#123A30]">
                {t(locale, "species")} <span className="text-red-700">*</span>
              </label>
              <select
                id="wf-species"
                name="species"
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                aria-invalid={!!errors.species}
                aria-describedby={errors.species ? "wf-species-error" : undefined}
                className="w-full rounded-xl border border-[#D1DBD5] bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30] focus:ring-2 focus:ring-[#123A30]/15"
              >
                <option value="">{t(locale, "chooseSpecies")}</option>
                {speciesOptions.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
              {errors.species && (
                <p id="wf-species-error" className="mt-1 text-sm text-red-700" role="alert">
                  {errors.species}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="wf-breed" className="mb-1.5 block text-sm font-medium text-[#123A30]">
                {t(locale, "breed")} <span className="text-[#95A8A2]">({t(locale, "optional")})</span>
              </label>
              <input
                id="wf-breed"
                name="breed"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="w-full rounded-xl border border-[#D1DBD5] bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30] focus:ring-2 focus:ring-[#123A30]/15"
              />
            </div>

            <div>
              <label htmlFor="wf-birthDate" className="mb-1.5 block text-sm font-medium text-[#123A30]">
                {t(locale, "birthDate")} <span className="text-[#95A8A2]">({t(locale, "optional")})</span>
              </label>
              <input
                id="wf-birthDate"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full rounded-xl border border-[#D1DBD5] bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30] focus:ring-2 focus:ring-[#123A30]/15"
              />
            </div>
          </div>

          <div>
            <label htmlFor="wf-note" className="mb-1.5 block text-sm font-medium text-[#123A30]">
              {t(locale, "note")} <span className="text-[#95A8A2]">({t(locale, "optional")})</span>
            </label>
            <textarea
              id="wf-note"
              name="note"
              rows={3}
              maxLength={500}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder={t(locale, "noteHint")}
              className="w-full rounded-xl border border-[#D1DBD5] bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30] focus:ring-2 focus:ring-[#123A30]/15 resize-y"
            />
            <p className="mt-1 text-right text-xs text-[#95A8A2]">{formData.note.length}/500</p>
          </div>
        </fieldset>

        {/* Consent checkboxes */}
        <fieldset className="space-y-3 border-t border-[#D1DBD5] pt-6">
          <legend className="sr-only">
            {locale === "tr" ? "Onaylar" : "Consents"}
          </legend>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#D1DBD5] bg-white p-4 text-sm leading-6 text-[#0D2922] focus-within:ring-2 focus-within:ring-[#123A30]/20">
            <input
              type="checkbox"
              checked={consentPrivacy}
              onChange={(e) => setConsentPrivacy(e.target.checked)}
              aria-invalid={!!errors.consentPrivacy}
              aria-describedby={errors.consentPrivacy ? "wf-consent-error" : undefined}
              className="mt-1 h-5 w-5 shrink-0 accent-[#123A30]"
            />
            <span>
              {t(locale, "privacyConsent")} <span className="text-red-700">*</span>
            </span>
          </label>
          {errors.consentPrivacy && (
            <p id="wf-consent-error" className="text-sm text-red-700" role="alert">
              {errors.consentPrivacy}
            </p>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#D1DBD5] bg-white p-4 text-sm leading-6 text-[#0D2922] focus-within:ring-2 focus-within:ring-[#123A30]/20">
            <input
              type="checkbox"
              checked={consentMarketing}
              onChange={(e) => setConsentMarketing(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[#123A30]"
            />
            <span>{t(locale, "marketingConsent")}</span>
          </label>
        </fieldset>
      </div>
    );
  };

  // ── Step 4: Review & Submit ──

  const renderStep4 = () => {
    if (!selectedService || !selectedSlot) return null;

    const displayPhone = maskPhone(formData.phone);
    const displayEmail = formData.email ? maskEmail(formData.email) : "-";

    const summaryItems = [
      { label: t(locale, "summaryService"), value: locale === "tr" ? selectedService.nameTr : selectedService.nameEn },
      {
        label: t(locale, "summaryVet"),
        value: selectedSlot.veterinarianName || t(locale, "summaryNoVet"),
      },
      { label: t(locale, "summaryDateTime"), value: `${selectedDate} ${selectedSlot.displayTime}` },
      {
        label: t(locale, "summaryDuration"),
        value: `${selectedService.durationMinutes} ${t(locale, "minutes")}`,
      },
      { label: t(locale, "summaryOwner"), value: formData.fullName },
      { label: t(locale, "summaryPet"), value: `${formData.petName} (${formData.species}${formData.breed ? `, ${formData.breed}` : ""})` },
      { label: t(locale, "summaryContact"), value: `${displayPhone}${formData.email ? ` · ${displayEmail}` : ""}` },
    ];

    return (
      <div className="space-y-6">
        {submitError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
            {submitError}
          </p>
        )}

        <div className="rounded-2xl border border-[#D1DBD5] bg-white p-6">
          <dl className="space-y-4">
            {summaryItems.map((item, i) => (
              <div key={item.label} className={i > 0 ? "border-t border-[#D1DBD5] pt-4" : ""}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#95A8A2]">
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#0D2922]">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {selectedService.requiresManualConfirmation && (
          <p className="rounded-xl bg-[#FFF8E8] p-4 text-sm leading-6 text-[#6F531C]">
            {locale === "tr"
              ? "Bu hizmet için randevu talebiniz alındıktan sonra klinik tarafından onaylanacaktır."
              : "This service requires clinic confirmation after submission."}
          </p>
        )}

        {/* Turnstile CAPTCHA widget */}
        <TurnstileWidget
          locale={locale}
          onTokenChange={setTurnstileToken}
          onError={setTurnstileError}
        />
        {turnstileError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
            {turnstileError}
          </p>
        )}

        <div className="rounded-xl border-2 border-[#CDA85F]/30 bg-[#FFF8E8] p-4 text-sm leading-6 text-[#6F531C]">
          <div className="flex items-start gap-2">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>{t(locale, "submitWarning")}</span>
          </div>
        </div>
      </div>
    );
  };

  // ── Render ──

  return (
    <div ref={topRef} tabIndex={-1} className="outline-none">
      {/* Screen reader announcer */}
      <div ref={announceRef} aria-live="polite" className="sr-only" />

      <StepIndicator current={step} locale={locale} />

      <div className="rounded-[2rem] border border-[#D1DBD5]/50 bg-white p-6 shadow-[0_15px_40px_rgba(13,41,34,0.07)] sm:p-8">
        <h2 className="mb-6 text-xl font-semibold text-[#0D2922]">
          {t(locale, `step${step}Title`)}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) {
              goToStep(step + 1);
            } else if (step === 3) {
              if (validateStep(3)) goToStep(4);
            } else {
              handleSubmit();
            }
          }}
          noValidate
        >
          {/* Step content */}
          <div className="min-h-[300px]">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </div>

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-[#D1DBD5] pt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => goToStep(step - 1)}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-[#D1DBD5] bg-white px-5 py-3 text-sm font-semibold text-[#0D2922] transition hover:border-[#123A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30"
              >
                <ArrowLeft size={16} />
                {t(locale, "back")}
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="submit"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#123A30] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30"
              >
                {t(locale, "next")}
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#123A30] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    {t(locale, "submitting")}
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    {t(locale, "submit")}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
