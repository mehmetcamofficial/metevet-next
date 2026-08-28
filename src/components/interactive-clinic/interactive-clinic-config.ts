import type { Locale } from "@/types";

export type DiscoveryId = "examination" | "preventive" | "diagnosis" | "recovery";
export type GuideChoice = "cat" | "dog";

export const DISCOVERY_STAGE: Record<DiscoveryId, number> = {
  preventive: 0,
  examination: 1,
  diagnosis: 2,
  recovery: 3,
};

export const interactiveCopy = {
  tr: {
    chooseGuide: "Rehberinizi seçin",
    interactiveCat: "Etkileşimli rehber: Kedi",
    cat: "Kedi",
    dog: "Köpek",
    progress: (count: number) => `Klinik keşfi ${count} / 4`,
    discover: "Keşfet",
    close: "Kapat",
    discoveries: {
      examination: {
        title: "Dikkatli muayene",
        body: "Her değerlendirme dikkatli gözlem ve ayrıntılı öykü ile başlar.",
      },
      preventive: {
        title: "Koruyucu bakım",
        body: "Aşı, parazit kontrolü ve düzenli takip sağlığın korunmasına yardımcı olur.",
      },
      diagnosis: {
        title: "Tanı ve tedavi",
        body: "Modern değerlendirme yöntemleri doğru klinik kararı destekler.",
      },
      recovery: {
        title: "İyileşme ve takip",
        body: "Bakım, klinikten ayrıldıktan sonra da planlı takip ile devam eder.",
      },
    },
    quizQuestion: "Patili dostunuz için hangi konuda destek arıyorsunuz?",
    quizOptions: ["Rutin kontrol", "Aşı ve koruyucu bakım", "Yeni bir belirti", "Tedavi sonrası takip", "Kliniği tanımak istiyorum"],
    disclaimer: "Bu yönlendirme tıbbi teşhis değildir. Uygun değerlendirme için veteriner hekime danışın.",
    suggestion: "Genel muayene ve uygun hizmet planlaması için ekibimizle görüşebilirsiniz.",
    completed: "MeteVet Klinik Yolculuğu tamamlandı.",
    summary: "Dikkatli değerlendirme, koruyucu bakım, bilimsel yaklaşım ve planlı takip aynı bakım yolculuğunun parçalarıdır.",
    appointment: "Randevu Al",
    whatsapp: "WhatsApp",
    directions: "Yol Tarifi",
  },
  en: {
    chooseGuide: "Choose your guide",
    interactiveCat: "Interactive guide: Cat",
    cat: "Cat",
    dog: "Dog",
    progress: (count: number) => `Clinic discovery ${count} / 4`,
    discover: "Discover",
    close: "Close",
    discoveries: {
      examination: {
        title: "Careful examination",
        body: "Every assessment begins with careful observation and a detailed history.",
      },
      preventive: {
        title: "Preventive care",
        body: "Vaccination, parasite control and regular follow-up help protect health.",
      },
      diagnosis: {
        title: "Diagnosis and treatment",
        body: "Modern assessment methods support sound clinical decisions.",
      },
      recovery: {
        title: "Recovery and follow-up",
        body: "Care continues with planned follow-up after leaving the clinic.",
      },
    },
    quizQuestion: "What kind of support are you looking for?",
    quizOptions: ["Routine check-up", "Vaccination and preventive care", "A new concern", "Post-treatment follow-up", "I want to learn about the clinic"],
    disclaimer: "This guidance is not a medical diagnosis. Consult a veterinarian for an appropriate assessment.",
    suggestion: "Contact our team to plan a general examination and the appropriate service.",
    completed: "You completed the MeteVet clinic journey.",
    summary: "Careful assessment, preventive care, scientific insight and planned follow-up belong to one connected care journey.",
    appointment: "Book Appointment",
    whatsapp: "WhatsApp",
    directions: "Directions",
  },
} satisfies Record<Locale, unknown>;
