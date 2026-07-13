const WHATSAPP_NUMBER = "905065859155";

export function formatAppointmentMessage(values: Record<string, string | boolean>) {
  const lines = [
    "MeteVet randevu talebi",
    "",
    `Ad Soyad: ${values.fullName ?? "-"}`,
    `Telefon: ${values.phone ?? "-"}`,
    `Hayvan Adı: ${values.petName ?? "-"}`,
    `Hayvan Türü: ${values.petType ?? "-"}`,
    `Hizmet: ${values.service ?? "-"}`,
    `Tercih Edilen Gün: ${values.preferredDay ?? "-"}`,
    `Tercih Edilen Saat: ${values.preferredTime ?? "-"}`,
    `Mesaj: ${values.message ?? "-"}`,
    `KVKK Onayı: ${values.privacyConsent ? "Evet" : "Hayır"}`,
    "",
    "Randevu klinik teyidiyle kesinleşir.",
  ];

  return lines.join("\n");
}

export function getWhatsAppUrl(message: string) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}
