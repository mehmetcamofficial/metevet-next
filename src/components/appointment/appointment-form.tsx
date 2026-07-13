"use client";

import { useState } from "react";
import { CalendarCheck2, CheckCircle2, ClipboardList, ExternalLink, PawPrint, Send } from "lucide-react";
import { formatAppointmentMessage, getWhatsAppUrl } from "@/src/lib/whatsapp";
import type { Locale } from "@/types";

type FormValues = {
  fullName: string;
  phone: string;
  petName: string;
  petType: string;
  petAge: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  description: string;
  privacyConsent: boolean;
};

type FieldName = keyof FormValues;
type FormErrors = Partial<Record<FieldName, string>>;

const initialValues: FormValues = {
  fullName: "",
  phone: "",
  petName: "",
  petType: "",
  petAge: "",
  service: "",
  preferredDate: "",
  preferredTime: "",
  description: "",
  privacyConsent: false,
};

const copy = {
  tr: {
    steps: ["İletişim Bilgileri", "Hayvan ve Hizmet", "Tarih ve Açıklama"],
    fields: {
      fullName: "Ad Soyad",
      phone: "Telefon",
      petName: "Hayvanın Adı",
      petType: "Hayvan Türü",
      petAge: "Hayvanın Yaşı",
      service: "Hizmet Seçimi",
      preferredDate: "Tercih Edilen Tarih",
      preferredTime: "Tercih Edilen Zaman Aralığı",
      description: "Kısa Açıklama / Şikâyet",
    },
    optional: "İsteğe bağlı",
    required: "Zorunlu alan",
    select: "Seçiniz",
    petTypes: ["Kedi", "Köpek", "Kuş", "Egzotik Hayvan", "Diğer"],
    times: ["Sabah", "Öğle", "Öğleden Sonra", "Akşam"],
    consent: "Randevu talebimin iletilmesi amacıyla paylaştığım kişisel verilerin işlenmesine ilişkin KVKK onayını kabul ediyorum.",
    timeNotice: "Talep ettiğiniz zaman aralığı kesin değildir. Randevu, klinik teyidinden sonra kesinleşir.",
    submit: "WhatsApp ile Randevu Talebi Gönder",
    summary: "Randevu Talebi Özeti",
    summaryEmpty: "Henüz seçilmedi",
    pet: "Hayvan",
    dateAndTime: "Tarih ve Zaman",
    successTitle: "Randevu talebiniz hazırlandı",
    successBody: "WhatsApp yeni bir sekmede açılacaktır. Mesajı WhatsApp üzerinden gönderdiğinizde talebiniz kliniğe ulaşır.",
    successNotice: "Bu işlem randevunun oluşturulduğu anlamına gelmez. Randevu yalnızca klinik teyidinden sonra kesinleşir.",
    retry: "WhatsApp'ı Tekrar Aç",
    edit: "Talebi Düzenle",
    errors: {
      fullName: "Lütfen adınızı ve soyadınızı girin.",
      phoneRequired: "Lütfen telefon numaranızı girin.",
      phoneInvalid: "Geçerli bir Türkiye mobil numarası girin. Örn. 05XX XXX XX XX veya +90 5XX XXX XX XX.",
      petName: "Lütfen hayvanın adını girin.",
      petType: "Lütfen hayvan türünü seçin.",
      service: "Lütfen bir hizmet seçin.",
      preferredDate: "Lütfen gelecekte bir tarih seçin.",
      preferredTime: "Lütfen tercih ettiğiniz zaman aralığını seçin.",
      privacyConsent: "Devam etmek için KVKK onayını kabul etmelisiniz.",
    },
  },
  en: {
    steps: ["Contact Details", "Pet and Service", "Date and Description"],
    fields: {
      fullName: "Full Name",
      phone: "Phone",
      petName: "Pet Name",
      petType: "Pet Type",
      petAge: "Pet Age",
      service: "Selected Service",
      preferredDate: "Preferred Date",
      preferredTime: "Preferred Time Range",
      description: "Short Description / Concern",
    },
    optional: "Optional",
    required: "Required field",
    select: "Select",
    petTypes: ["Cat", "Dog", "Bird", "Exotic Pet", "Other"],
    times: ["Morning", "Noon", "Afternoon", "Evening"],
    consent: "I consent to the processing of the personal information I provide for the purpose of sending this appointment request.",
    timeNotice: "Your requested time range is not final. The appointment becomes final only after clinic confirmation.",
    submit: "Send Appointment Request via WhatsApp",
    summary: "Appointment Request Summary",
    summaryEmpty: "Not selected yet",
    pet: "Pet",
    dateAndTime: "Date and Time",
    successTitle: "Your appointment request is ready",
    successBody: "WhatsApp will open in a new tab. Your request reaches the clinic after you send the message in WhatsApp.",
    successNotice: "This does not mean that an appointment has been booked. It becomes final only after clinic confirmation.",
    retry: "Open WhatsApp Again",
    edit: "Edit Request",
    errors: {
      fullName: "Please enter your full name.",
      phoneRequired: "Please enter your phone number.",
      phoneInvalid: "Enter a valid Turkish mobile number, such as 05XX XXX XX XX or +90 5XX XXX XX XX.",
      petName: "Please enter your pet's name.",
      petType: "Please select a pet type.",
      service: "Please select a service.",
      preferredDate: "Please select a future date.",
      preferredTime: "Please select a preferred time range.",
      privacyConsent: "You must accept the privacy consent to continue.",
    },
  },
} as const;

function normalizeTurkishMobile(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0090")) digits = digits.slice(4);
  else if (digits.startsWith("90") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);

  if (!/^5\d{9}$/.test(digits)) return null;
  return `+90 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
}

function RequiredMark({ label }: { label: string }) {
  return <span className="ml-1 text-red-700" aria-label={label}>*</span>;
}

function ErrorMessage({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="mt-2 text-sm font-medium text-red-700">{message}</p> : null;
}

const fieldClass = "w-full rounded-xl border border-[#0D2922]/15 bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30] focus:ring-2 focus:ring-[#123A30]/15";

export function AppointmentForm({
  locale,
  minimumDate,
  serviceOptions,
}: {
  locale: Locale;
  minimumDate: string;
  serviceOptions: Array<{ value: string; label: string }>;
}) {
  const text = copy[locale];
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState("");

  const updateField = <K extends FieldName>(field: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!values.fullName.trim()) nextErrors.fullName = text.errors.fullName;
    if (!values.phone.trim()) nextErrors.phone = text.errors.phoneRequired;
    else if (!normalizeTurkishMobile(values.phone)) nextErrors.phone = text.errors.phoneInvalid;
    if (!values.petName.trim()) nextErrors.petName = text.errors.petName;
    if (!values.petType) nextErrors.petType = text.errors.petType;
    if (!values.service) nextErrors.service = text.errors.service;
    if (!values.preferredDate || values.preferredDate < minimumDate) nextErrors.preferredDate = text.errors.preferredDate;
    if (!values.preferredTime) nextErrors.preferredTime = text.errors.preferredTime;
    if (!values.privacyConsent) nextErrors.privacyConsent = text.errors.privacyConsent;

    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0] as FieldName | undefined;
    if (firstInvalid) window.requestAnimationFrame(() => document.getElementById(firstInvalid)?.focus());
    return Object.keys(nextErrors).length === 0;
  };

  const createWhatsAppUrl = () => {
    const normalizedPhone = normalizeTurkishMobile(values.phone) ?? values.phone.trim();
    const message = formatAppointmentMessage({
      fullName: values.fullName.trim(),
      phone: normalizedPhone,
      petName: values.petName.trim(),
      petType: values.petType,
      petAge: values.petAge.trim(),
      service: values.service,
      preferredDate: values.preferredDate,
      preferredTime: values.preferredTime,
      description: values.description.trim(),
    }, locale);
    return getWhatsAppUrl(message);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    const url = createWhatsAppUrl();
    setWhatsappUrl(url);
    setSubmitted(true);
    window.open(url, "_blank", "noopener,noreferrer");
    setIsSubmitting(false);
  };

  const summaryItems = [
    { label: text.fields.fullName, value: values.fullName },
    { label: text.pet, value: [values.petName, values.petType, values.petAge].filter(Boolean).join(" · ") },
    { label: text.fields.service, value: values.service },
    { label: text.dateAndTime, value: [values.preferredDate, values.preferredTime].filter(Boolean).join(" · ") },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="rounded-[2rem] border border-[#0D2922]/10 bg-[#DDE9E3]/80 p-6 shadow-[0_20px_60px_rgba(13,41,34,0.08)] sm:p-8">
        {submitted ? (
          <section aria-live="polite" aria-labelledby="appointment-success-title" className="flex min-h-[420px] flex-col justify-center rounded-[1.5rem] border border-[#123A30]/10 bg-white p-7 text-center sm:p-10">
            <CheckCircle2 className="mx-auto text-[#123A30]" size={42} />
            <h2 id="appointment-success-title" className="mt-5 text-2xl font-semibold text-[#0D2922]">{text.successTitle}</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-[#687A75]">{text.successBody}</p>
            <p className="mx-auto mt-4 max-w-xl rounded-[1.2rem] bg-[#FFF8E8] p-4 text-sm leading-7 text-[#6F531C]">{text.successNotice}</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#123A30] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30">
                <ExternalLink size={16} />{text.retry}
              </button>
              <button type="button" onClick={() => setSubmitted(false)} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#123A30]/15 bg-white px-5 py-3 text-sm font-semibold text-[#123A30] transition hover:border-[#123A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30">
                {text.edit}
              </button>
            </div>
          </section>
        ) : (
          <form onSubmit={handleSubmit} noValidate aria-describedby="appointment-time-notice" className="space-y-8">
            <fieldset className="space-y-5">
              <legend className="flex items-center gap-3 text-lg font-semibold text-[#0D2922]"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#123A30] text-sm text-white">1</span>{text.steps[0]}</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-[#123A30]">{text.fields.fullName}<RequiredMark label={text.required} /></label>
                  <input id="fullName" name="fullName" autoComplete="name" value={values.fullName} onChange={(event) => updateField("fullName", event.target.value)} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? "fullName-error" : undefined} className={fieldClass} />
                  <ErrorMessage id="fullName-error" message={errors.fullName} />
                </div>
                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-[#123A30]">{text.fields.phone}<RequiredMark label={text.required} /></label>
                  <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={(event) => updateField("phone", event.target.value)} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} placeholder="+90 5XX XXX XX XX" className={fieldClass} />
                  <ErrorMessage id="phone-error" message={errors.phone} />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-5 border-t border-[#0D2922]/10 pt-7">
              <legend className="flex items-center gap-3 pr-3 text-lg font-semibold text-[#0D2922]"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#123A30] text-sm text-white">2</span>{text.steps[1]}</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="petName" className="mb-2 block text-sm font-medium text-[#123A30]">{text.fields.petName}<RequiredMark label={text.required} /></label>
                  <input id="petName" name="petName" value={values.petName} onChange={(event) => updateField("petName", event.target.value)} aria-invalid={Boolean(errors.petName)} aria-describedby={errors.petName ? "petName-error" : undefined} className={fieldClass} />
                  <ErrorMessage id="petName-error" message={errors.petName} />
                </div>
                <div>
                  <label htmlFor="petAge" className="mb-2 block text-sm font-medium text-[#123A30]">{text.fields.petAge} <span className="text-[#687A75]">({text.optional})</span></label>
                  <input id="petAge" name="petAge" value={values.petAge} onChange={(event) => updateField("petAge", event.target.value)} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="petType" className="mb-2 block text-sm font-medium text-[#123A30]">{text.fields.petType}<RequiredMark label={text.required} /></label>
                  <select id="petType" name="petType" value={values.petType} onChange={(event) => updateField("petType", event.target.value)} aria-invalid={Boolean(errors.petType)} aria-describedby={errors.petType ? "petType-error" : undefined} className={fieldClass}>
                    <option value="">{text.select}</option>
                    {text.petTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <ErrorMessage id="petType-error" message={errors.petType} />
                </div>
                <div>
                  <label htmlFor="service" className="mb-2 block text-sm font-medium text-[#123A30]">{text.fields.service}<RequiredMark label={text.required} /></label>
                  <select id="service" name="service" value={values.service} onChange={(event) => updateField("service", event.target.value)} aria-invalid={Boolean(errors.service)} aria-describedby={errors.service ? "service-error" : undefined} className={fieldClass}>
                    <option value="">{text.select}</option>
                    {serviceOptions.map((item) => <option key={item.value} value={item.label}>{item.label}</option>)}
                  </select>
                  <ErrorMessage id="service-error" message={errors.service} />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-5 border-t border-[#0D2922]/10 pt-7">
              <legend className="flex items-center gap-3 pr-3 text-lg font-semibold text-[#0D2922]"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#123A30] text-sm text-white">3</span>{text.steps[2]}</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="preferredDate" className="mb-2 block text-sm font-medium text-[#123A30]">{text.fields.preferredDate}<RequiredMark label={text.required} /></label>
                  <input id="preferredDate" name="preferredDate" type="date" min={minimumDate} value={values.preferredDate} onChange={(event) => updateField("preferredDate", event.target.value)} aria-invalid={Boolean(errors.preferredDate)} aria-describedby={errors.preferredDate ? "preferredDate-error" : undefined} className={fieldClass} />
                  <ErrorMessage id="preferredDate-error" message={errors.preferredDate} />
                </div>
                <div>
                  <label htmlFor="preferredTime" className="mb-2 block text-sm font-medium text-[#123A30]">{text.fields.preferredTime}<RequiredMark label={text.required} /></label>
                  <select id="preferredTime" name="preferredTime" value={values.preferredTime} onChange={(event) => updateField("preferredTime", event.target.value)} aria-invalid={Boolean(errors.preferredTime)} aria-describedby={errors.preferredTime ? "preferredTime-error appointment-time-notice" : "appointment-time-notice"} className={fieldClass}>
                    <option value="">{text.select}</option>
                    {text.times.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <ErrorMessage id="preferredTime-error" message={errors.preferredTime} />
                </div>
              </div>
              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium text-[#123A30]">{text.fields.description} <span className="text-[#687A75]">({text.optional})</span></label>
                <textarea id="description" name="description" value={values.description} onChange={(event) => updateField("description", event.target.value)} className={`${fieldClass} min-h-32 resize-y rounded-[1.2rem]`} />
              </div>
            </fieldset>

            <div>
              <label className="flex cursor-pointer items-start gap-3 rounded-[1.2rem] border border-[#0D2922]/10 bg-white p-4 text-sm leading-7 text-[#0D2922] focus-within:ring-2 focus-within:ring-[#123A30]/20">
                <input id="privacyConsent" name="privacyConsent" type="checkbox" checked={values.privacyConsent} onChange={(event) => updateField("privacyConsent", event.target.checked)} aria-invalid={Boolean(errors.privacyConsent)} aria-describedby={errors.privacyConsent ? "privacyConsent-error" : undefined} className="mt-1 h-5 w-5 shrink-0 accent-[#123A30]" />
                <span>{text.consent}<RequiredMark label={text.required} /></span>
              </label>
              <ErrorMessage id="privacyConsent-error" message={errors.privacyConsent} />
            </div>

            <p id="appointment-time-notice" className="rounded-[1.2rem] border border-[#CDA85F]/30 bg-[#FFF8E8] p-4 text-sm leading-7 text-[#6F531C]">{text.timeNotice}</p>
            <div aria-live="polite" className="sr-only">{Object.keys(errors).length > 0 ? (locale === "tr" ? "Formda düzeltilmesi gereken alanlar var." : "Some fields need your attention.") : ""}</div>
            <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#123A30] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
              <Send size={16} />{text.submit}
            </button>
          </form>
        )}
      </div>

      <aside aria-labelledby="appointment-summary-title" className="rounded-[1.7rem] border border-[#0D2922]/10 bg-white p-6 shadow-[0_15px_40px_rgba(13,41,34,0.07)] lg:sticky lg:top-28">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DDE9E3] text-[#123A30]"><ClipboardList size={20} /></div>
        <h2 id="appointment-summary-title" className="mt-5 text-xl font-semibold text-[#0D2922]">{text.summary}</h2>
        <dl className="mt-6 space-y-5">
          {summaryItems.map((item, index) => (
            <div key={item.label} className={index > 0 ? "border-t border-[#0D2922]/10 pt-5" : ""}>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[#CDA85F]">{item.label}</dt>
              <dd className="mt-2 break-words text-sm leading-6 text-[#0D2922]">{item.value || text.summaryEmpty}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex items-start gap-3 rounded-[1.2rem] bg-[#F4F0E8] p-4 text-xs leading-6 text-[#687A75]">
          <CalendarCheck2 className="mt-0.5 shrink-0 text-[#123A30]" size={17} />{text.timeNotice}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-[#687A75]"><PawPrint size={15} className="text-[#CDA85F]" />MeteVet Veteriner Kliniği</div>
      </aside>
    </div>
  );
}
