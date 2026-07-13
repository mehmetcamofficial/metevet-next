import type { Locale } from "@/types";

const WHATSAPP_NUMBER = "905065859155";

export type AppointmentMessageValues = {
  fullName: string;
  phone: string;
  petName: string;
  petType: string;
  petAge: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  description: string;
};

export function formatAppointmentMessage(values: AppointmentMessageValues, locale: Locale) {
  const isTurkish = locale === "tr";
  const lines = isTurkish
    ? [
        "MeteVet Randevu Talebi",
        "Dil: Türkçe",
        "",
        `Ad Soyad: ${values.fullName}`,
        `Telefon: ${values.phone}`,
        `Hayvanın Adı: ${values.petName}`,
        `Hayvan Türü: ${values.petType}`,
        `Hayvanın Yaşı: ${values.petAge || "Belirtilmedi"}`,
        `Seçilen Hizmet: ${values.service}`,
        `Tercih Edilen Tarih: ${values.preferredDate}`,
        `Tercih Edilen Zaman Aralığı: ${values.preferredTime}`,
        `Kısa Açıklama / Şikâyet: ${values.description || "Belirtilmedi"}`,
        "",
        "Bu bir randevu talebidir. Randevu, klinik teyidinden sonra kesinleşir.",
      ]
    : [
        "MeteVet Appointment Request",
        "Language: English",
        "",
        `Full Name: ${values.fullName}`,
        `Phone: ${values.phone}`,
        `Pet Name: ${values.petName}`,
        `Pet Type: ${values.petType}`,
        `Pet Age: ${values.petAge || "Not provided"}`,
        `Selected Service: ${values.service}`,
        `Preferred Date: ${values.preferredDate}`,
        `Preferred Time Range: ${values.preferredTime}`,
        `Short Description / Concern: ${values.description || "Not provided"}`,
        "",
        "This is an appointment request. The appointment becomes final only after clinic confirmation.",
      ];

  return lines.join("\n");
}

export function getWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
