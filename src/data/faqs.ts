import type { FaqItem } from "@/types";

export const faqs: Record<"tr" | "en", FaqItem[]> = {
  tr: [
    { question: "İlk muayene ne kadar sürer?", answer: "İlk değerlendirme genellikle 20-40 dakika sürer; ihtiyaç duyulursa daha uzun bir plan oluşturabiliriz." },
    { question: "Aşı takibi nasıl yapılır?", answer: "Aşı takibi için randevu tarihleri ve gerekli hatırlatmalar net bir şekilde paylaşılır." },
    { question: "Acil durumda nasıl iletişime geçebilirim?", answer: "WhatsApp üzerinden kısa mesajla ulaşabilirsiniz; acil durumlarda da klinik ile iletişim kurmayı öneririz." },
    { question: "Randevu almadan gelebilir miyim?", answer: "Randevu tercih edilse de kısa süreli değerlendirme talepleri için iletişime geçebilirsiniz." },
    { question: "Kliniğe gelirken hangi belgeleri getirmeliyim?", answer: "Önceki tetkik raporları, aşı kartı ve varsa ilaç bilgileri yardımcı olur." },
  ],
  en: [
    { question: "How long does the first consultation take?", answer: "The initial assessment typically takes 20-40 minutes, and we can allow more time if needed." },
    { question: "How does vaccine follow-up work?", answer: "We provide clear scheduling guidance and reminders for vaccine follow-up plans." },
    { question: "How can I contact you in an emergency?", answer: "You can reach us through WhatsApp for urgent questions, and we recommend contacting the clinic directly in emergencies." },
    { question: "Can I come without an appointment?", answer: "You may contact us for short-notice assessment requests even if an appointment is preferred." },
    { question: "What should I bring to the clinic?", answer: "Previous test results, vaccine records, and medication information can be helpful." },
  ],
};
