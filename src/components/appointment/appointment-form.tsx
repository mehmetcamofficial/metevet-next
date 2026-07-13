"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { getDictionary } from "@/src/lib/i18n";
import { formatAppointmentMessage, getWhatsAppUrl } from "@/src/lib/whatsapp";
import type { Locale } from "@/types";

type FormValues = {
  fullName: string;
  phone: string;
  petName: string;
  petType: string;
  service: string;
  preferredDay: string;
  preferredTime: string;
  message: string;
  privacyConsent: boolean;
};

const initialValues: FormValues = {
  fullName: "",
  phone: "",
  petName: "",
  petType: "",
  service: "",
  preferredDay: "",
  preferredTime: "",
  message: "",
  privacyConsent: false,
};

export function AppointmentForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};

    if (!values.fullName.trim()) nextErrors.fullName = dict.appointmentPage.validation.fullName;
    if (!values.phone.trim()) nextErrors.phone = dict.appointmentPage.validation.phone;
    if (!values.petName.trim()) nextErrors.petName = dict.appointmentPage.validation.petName;
    if (!values.petType.trim()) nextErrors.petType = dict.appointmentPage.validation.petType;
    if (!values.service.trim()) nextErrors.service = dict.appointmentPage.validation.service;
    if (!values.preferredDay.trim()) nextErrors.preferredDay = dict.appointmentPage.validation.preferredDay;
    if (!values.preferredTime.trim()) nextErrors.preferredTime = dict.appointmentPage.validation.preferredTime;
    if (!values.message.trim()) nextErrors.message = dict.appointmentPage.validation.message;
    if (!values.privacyConsent) nextErrors.privacyConsent = dict.appointmentPage.validation.privacyConsent;

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    const message = formatAppointmentMessage(values);
    setSubmitted(true);
    window.open(getWhatsAppUrl(message), "_blank", "noopener,noreferrer");
  };

  const notice = useMemo(() => dict.appointmentPage.notice, [dict]);

  const updateField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div className="flex items-center gap-2 rounded-full border border-[#123A30]/10 bg-white/70 px-3 py-2 text-sm font-semibold text-[#123A30] w-fit">
        <Sparkles size={14} />
        {locale === "tr" ? "Kişiselleştirilmiş bakım talebi" : "Personalized care request"}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-[#123A30]">{dict.appointmentPage.form.fullName}</label>
          <input id="fullName" name="fullName" value={values.fullName} onChange={(event) => updateField("fullName", event.target.value)} className="w-full rounded-full border border-[#0D2922]/10 bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30]" />
          {errors.fullName ? <p className="mt-2 text-sm text-red-600">{errors.fullName}</p> : null}
        </div>
        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-medium text-[#123A30]">{dict.appointmentPage.form.phone}</label>
          <input id="phone" name="phone" value={values.phone} onChange={(event) => updateField("phone", event.target.value)} className="w-full rounded-full border border-[#0D2922]/10 bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30]" />
          {errors.phone ? <p className="mt-2 text-sm text-red-600">{errors.phone}</p> : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label htmlFor="petName" className="mb-2 block text-sm font-medium text-[#123A30]">{dict.appointmentPage.form.petName}</label>
          <input id="petName" name="petName" value={values.petName} onChange={(event) => updateField("petName", event.target.value)} className="w-full rounded-full border border-[#0D2922]/10 bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30]" />
          {errors.petName ? <p className="mt-2 text-sm text-red-600">{errors.petName}</p> : null}
        </div>
        <div>
          <label htmlFor="petType" className="mb-2 block text-sm font-medium text-[#123A30]">{dict.appointmentPage.form.petType}</label>
          <input id="petType" name="petType" value={values.petType} onChange={(event) => updateField("petType", event.target.value)} className="w-full rounded-full border border-[#0D2922]/10 bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30]" />
          {errors.petType ? <p className="mt-2 text-sm text-red-600">{errors.petType}</p> : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label htmlFor="service" className="mb-2 block text-sm font-medium text-[#123A30]">{dict.appointmentPage.form.service}</label>
          <select id="service" name="service" value={values.service} onChange={(event) => updateField("service", event.target.value)} className="w-full rounded-full border border-[#0D2922]/10 bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30]">
            <option value="">{locale === "tr" ? "Seçiniz" : "Select"}</option>
            <option value="Genel Muayene">{locale === "tr" ? "Genel Muayene" : "General Examination"}</option>
            <option value="Aşı ve Koruyucu Hekimlik">{locale === "tr" ? "Aşı ve Koruyucu Hekimlik" : "Vaccination & Preventive Care"}</option>
            <option value="Laboratuvar ve Tanı">{locale === "tr" ? "Laboratuvar ve Tanı" : "Laboratory & Diagnostics"}</option>
            <option value="Cerrahi İşlemler">{locale === "tr" ? "Cerrahi İşlemler" : "Surgical Procedures"}</option>
            <option value="Diş ve Ağız Sağlığı">{locale === "tr" ? "Diş ve Ağız Sağlığı" : "Dental & Oral Health"}</option>
            <option value="Acil Değerlendirme">{locale === "tr" ? "Acil Değerlendirme" : "Urgent Assessment"}</option>
          </select>
          {errors.service ? <p className="mt-2 text-sm text-red-600">{errors.service}</p> : null}
        </div>
        <div>
          <label htmlFor="preferredDay" className="mb-2 block text-sm font-medium text-[#123A30]">{dict.appointmentPage.form.preferredDay}</label>
          <input id="preferredDay" name="preferredDay" value={values.preferredDay} onChange={(event) => updateField("preferredDay", event.target.value)} className="w-full rounded-full border border-[#0D2922]/10 bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30]" placeholder={locale === "tr" ? "Örn. Cuma" : "e.g. Friday"} />
          {errors.preferredDay ? <p className="mt-2 text-sm text-red-600">{errors.preferredDay}</p> : null}
        </div>
      </div>

      <div>
        <label htmlFor="preferredTime" className="mb-2 block text-sm font-medium text-[#123A30]">{dict.appointmentPage.form.preferredTime}</label>
        <input id="preferredTime" name="preferredTime" value={values.preferredTime} onChange={(event) => updateField("preferredTime", event.target.value)} className="w-full rounded-full border border-[#0D2922]/10 bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30]" placeholder={locale === "tr" ? "Örn. 15:00" : "e.g. 15:00"} />
        {errors.preferredTime ? <p className="mt-2 text-sm text-red-600">{errors.preferredTime}</p> : null}
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-[#123A30]">{dict.appointmentPage.form.message}</label>
        <textarea id="message" name="message" value={values.message} onChange={(event) => updateField("message", event.target.value)} className="min-h-32 w-full rounded-[1.2rem] border border-[#0D2922]/10 bg-white px-4 py-3 text-sm text-[#0D2922] outline-none transition focus:border-[#123A30]" />
        {errors.message ? <p className="mt-2 text-sm text-red-600">{errors.message}</p> : null}
      </div>

      <label className="flex items-start gap-3 rounded-[1.2rem] border border-[#0D2922]/10 bg-[#F4F0E8] p-4 text-sm text-[#0D2922]">
        <input type="checkbox" checked={values.privacyConsent} onChange={(event) => updateField("privacyConsent", event.target.checked)} className="mt-1 h-4 w-4 rounded border-[#0D2922]/20" />
        <span>{dict.appointmentPage.form.privacyConsent}</span>
      </label>
      {errors.privacyConsent ? <p className="text-sm text-red-600">{errors.privacyConsent}</p> : null}

      <div className="rounded-[1.2rem] border border-[#123A30]/15 bg-[#DDE9E3] p-4 text-sm text-[#0D2922]">{notice}</div>

      <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#123A30] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
        {submitted ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} 
        {dict.appointmentPage.form.submit}
      </button>
    </form>
  );
}
