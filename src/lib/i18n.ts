import type { Locale } from "@/types";

export const locales = ["tr", "en"] as const;
export type LocaleCode = (typeof locales)[number];

export const defaultLocale: Locale = "tr";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getLocaleFromPath(pathname: string): Locale {
  const [, maybeLocale] = pathname.split("/");
  return isLocale(maybeLocale ?? "") ? (maybeLocale as Locale) : defaultLocale;
}

export function getPathForLocale(path: string, locale: Locale) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withoutLocale = normalized.replace(/^\/tr|^\/en/, "") || "/";
  return locale === defaultLocale ? withoutLocale : `/${locale}${withoutLocale}`;
}

export function getLocalizedPath(pathname: string, locale: Locale) {
  const path = pathname === "/" ? "/" : pathname;
  return getPathForLocale(path, locale);
}

export const dictionaries = {
  tr: {
    nav: {
      home: "Ana Sayfa",
      about: "Hakkımızda",
      services: "Hizmetler",
      blog: "Blog",
      contact: "İletişim",
      appointment: "Randevu",
    },
    common: {
      appointmentCta: "Randevu Al",
      whatsapp: "WhatsApp",
      callNow: "Ara",
      bookNow: "Randevu Al",
      learnMore: "Daha Fazla",
      viewAll: "Tümünü Gör",
      readMore: "Devamını Oku",
      disclaimer: "Blog içerikleri bilgilendirme amaçlıdır; veteriner muayenesinin yerini tutmaz.",
      privacyConsent: "KVKK onayı veriyorum.",
    },
    home: {
      hero: {
        eyebrow: "Premium Veteriner Kliniği",
        title: "Bilimsel yaklaşım. Şefkatli bakım. Daha sağlıklı bir yaşam.",
        description:
          "MeteVet, koruyucu hekimlikten tanı ve tedaviye kadar patili dostlarınıza çağdaş, güvenilir ve kişiselleştirilmiş veteriner sağlık hizmetleri sunar.",
        primaryCta: "Randevu Al",
        secondaryCta: "WhatsApp",
      },
      trustStrip: ["4+ Yıl Tecrübe", "2020 Mezuniyeti", "Koruyucu Hekimlik", "Şeffaf İletişim"],
      services: {
        title: "Hizmetlerimiz",
        description: "İhtiyaçlarınıza göre tasarlanmış kapsamlı veteriner bakım hizmetleri.",
        linkLabel: "Tüm hizmetleri keşfet",
      },
      doctor: {
        title: "Doktor Profili",
        description: "Onur Metehan Çakır ile tanışın.",
        label: "Veteriner Hekim",
        biography:
          "Ocak 1997 Denizli doğumluyum. Aydın'ın Kuşadası ilçesinde ikamet ediyorum. Mehmet Akif Ersoy Üniversitesi Veteriner Fakültesi'nden 2020 yılında mezun oldum. Veteriner hekimlik mesleğini dünya standartlarında ve verimli bir şekilde gerçekleştirmek en büyük hedefimdir. Sahip olduğumuz ortam ve imkânları en iyi şekilde kullanarak patili dostlarımızın sağlıklı ve uzun ömürlü olmasına katkı sağlamak temel gayemizdir.",
      },
      philosophy: {
        title: "Bakım felsefemiz",
        description: "Dengeli, bilimsel ve şeffaf bir yaklaşımın ötesinde, uzun vadeli sağlığı destekleyen bir bakım modeli sunuyoruz.",
        items: [
          { title: "Koruyucu bakım", description: "Erken teşhis ve düzenli değerlendirmelerle sağlığı koruruz." },
          { title: "Bilimsel değerlendirme", description: "Tanı süreçlerini net ve objektif bir yaklaşımla yürütürüz." },
          { title: "Şeffaf iletişim", description: "Tedavi planlarını açıkça paylaşır ve sorularınızı yanıtlarız." },
          { title: "Uzun vadeli takip", description: "Patili dostlarınızın yaşam kalitesini sürekli destekleriz." },
        ],
      },
      appointment: {
        title: "Randevuya Hazır mısınız?",
        description: "İster koruyucu muayene ister daha karmaşık bir değerlendirme olsun, size uygun adımı birlikte belirleyelim.",
        phoneLabel: "Telefonla görüş",
        whatsappLabel: "WhatsApp ile yaz",
        pageLabel: "Randevu formu",
      },
      blog: {
        title: "Son Yazılar",
        description: "Patili dostlarınıza yönelik güncel ve bilgilendirici içerikler.",
        viewAll: "Tüm yazıları gör",
      },
      faq: {
        title: "Sık Sorulan Sorular",
        description: "Muayene, aşı takibi ve randevu süreci hakkında sık sorulan soruları inceleyin.",
      },
      contact: {
        title: "İletişime Geçin",
        description: "Kuşadası'nda, patilerinizin ihtiyaçlarına odaklanan kişiselleştirilmiş bakım için bize ulaşın.",
      },
    },
    about: {
      title: "MeteVet Hakkında",
      description: "MeteVet, koruyucu hekimlikten tanı ve tedaviye kadar güvenilir, çağdaş ve şefkatli bakım sunar.",
      intro: "Günümüzün modern pet owner beklentilerine uygun, bilim odaklı ve sakin bir klinik deneyimi sunmayı amaçlıyoruz.",
      bullets: [
        { title: "Koruyucu yaklaşım", description: "Sağlık sorunlarını büyümeden çözmek için erken ve düzenli değerlendirmeler yapıyoruz." },
        { title: "Şefkatli iletişim", description: "Hasta ve sahip ilişkisini güçlü tutan açık ve net iletişim kuruyoruz." },
        { title: "Modern klinik deneyimi", description: "Güvenli, çağdaş ve rahat bir ortamda bakım sunuyoruz." },
      ],
    },
    servicesPage: {
      title: "Hizmetler",
      description: "Özenle tasarlanmış hizmetlerimiz ile patili dostlarınızın sağlık yolculuğunu destekliyoruz.",
    },
    appointmentPage: {
      title: "Randevu Formu",
      description: "Kısa bir form doldurarak randevu talebinizi iletebilirsiniz.",
      notice: "Randevu onay süreci klinik teyidiyle tamamlanır.",
      form: {
        fullName: "Ad Soyad",
        phone: "Telefon",
        petName: "Hayvanın Adı",
        petType: "Hayvan Türü",
        service: "Hizmet Seçimi",
        preferredDay: "Tercih Edilen Gün",
        preferredTime: "Tercih Edilen Saat",
        message: "Mesaj",
        submit: "WhatsApp ile gönder",
        privacyConsent: "KVKK onayını kabul ediyorum.",
      },
      validation: {
        fullName: "Lütfen adınızı ve soyadınızı girin.",
        phone: "Lütfen geçerli bir telefon numarası girin.",
        petName: "Lütfen hayvanın adını girin.",
        petType: "Lütfen hayvan türünü girin.",
        service: "Lütfen bir hizmet seçin.",
        preferredDay: "Lütfen tercih edilen günü seçin.",
        preferredTime: "Lütfen tercih edilen saati seçin.",
        message: "Lütfen kısa bir mesaj bırakın.",
        privacyConsent: "Devam etmek için KVKK onayını kabul etmelisiniz.",
      },
    },
    blogPage: {
      title: "Blog",
      description: "Patili dostlarınız için doğru bilgiye erişin.",
    },
    contactPage: {
      title: "İletişim",
      description: "Sorularınız, randevu talepleriniz veya görüşleriniz için bizimle iletişime geçin.",
    },
    footer: {
      title: "MeteVet Veteriner Kliniği",
      description: "Patili dostlarınıza çağdaş, şefkatli ve güvenilir veteriner bakım sunuyoruz.",
      navigation: "Sayfalar",
      services: "Hizmetler",
      contact: "İletişim",
      legal: "Yasal",
      language: "Dil",
      currentYear: "Tüm hakları saklıdır.",
    },
  },
  en: {
    nav: {
      home: "Home",
      about: "About",
      services: "Services",
      blog: "Blog",
      contact: "Contact",
      appointment: "Appointment",
    },
    common: {
      appointmentCta: "Book an Appointment",
      whatsapp: "WhatsApp",
      callNow: "Call",
      bookNow: "Book Now",
      learnMore: "Learn More",
      viewAll: "View All",
      readMore: "Read More",
      disclaimer: "Blog content is informational only and does not replace veterinary examination.",
      privacyConsent: "I consent to privacy processing.",
    },
    home: {
      hero: {
        eyebrow: "Premium Veterinary Clinic",
        title: "Scientific care. Compassionate support. A healthier life.",
        description:
          "MeteVet offers modern, trustworthy, and personalized veterinary care for companion animals from preventive medicine to diagnosis and treatment.",
        primaryCta: "Book an Appointment",
        secondaryCta: "WhatsApp",
      },
      trustStrip: ["4+ Years of Experience", "Graduated in 2020", "Preventive Care", "Transparent Communication"],
      services: {
        title: "Our Services",
        description: "Comprehensive veterinary care tailored to your pet’s needs.",
        linkLabel: "Explore all services",
      },
      doctor: {
        title: "Doctor Profile",
        description: "Meet Onur Metehan Çakır.",
        label: "Veterinarian",
        biography:
          "I was born in Denizli in January 1997 and live in Kuşadası, Aydın. I graduated from Mehmet Akif Ersoy University Veterinary Faculty in 2020. My greatest goal is to practice veterinary medicine at world-class standards and with efficiency. Our core purpose is to contribute to the healthy and long-lived lives of our animal companions by using the environment and resources we have in the best possible way.",
      },
      philosophy: {
        title: "Our care philosophy",
        description: "We offer a model of care that is balanced, scientific, and transparent while supporting long-term health.",
        items: [
          { title: "Preventive care", description: "We protect health with early and regular evaluations." },
          { title: "Scientific evaluation", description: "We handle diagnostics in a clear and objective way." },
          { title: "Transparent communication", description: "We explain treatment plans openly and answer your questions clearly." },
          { title: "Long-term follow-up", description: "We support your pet’s quality of life over time." },
        ],
      },
      appointment: {
        title: "Ready to make an appointment?",
        description: "Whether you need a preventive visit or a more detailed evaluation, we can help you choose the right next step.",
        phoneLabel: "Call us",
        whatsappLabel: "Message on WhatsApp",
        pageLabel: "Appointment form",
      },
      blog: {
        title: "Latest Articles",
        description: "Practical and informative content for pet owners.",
        viewAll: "View all articles",
      },
      faq: {
        title: "Frequently Asked Questions",
        description: "Review common questions about visits, vaccines, and scheduling.",
      },
      contact: {
        title: "Get in Touch",
        description: "Contact us for tailored care focused on your pet’s needs in Kuşadası.",
      },
    },
    about: {
      title: "About MeteVet",
      description: "MeteVet offers reliable, modern, and compassionate care from preventive medicine to diagnosis and treatment.",
      intro: "We aim to create a calm, science-led clinic experience aligned with the expectations of modern pet owners.",
      bullets: [
        { title: "Preventive approach", description: "We perform early and regular evaluations to prevent issues before they grow." },
        { title: "Compassionate communication", description: "We prioritize clear and supportive communication between clinicians and pet owners." },
        { title: "Modern clinic experience", description: "We provide safe, contemporary, and comfortable care in a refined environment." },
      ],
    },
    servicesPage: {
      title: "Services",
      description: "We support your pet’s health journey with carefully designed services and thoughtful care.",
    },
    appointmentPage: {
      title: "Appointment Form",
      description: "Submit a short form to request an appointment.",
      notice: "The appointment will be finalized only after clinic confirmation.",
      form: {
        fullName: "Full Name",
        phone: "Phone",
        petName: "Pet Name",
        petType: "Pet Type",
        service: "Service",
        preferredDay: "Preferred Day",
        preferredTime: "Preferred Time",
        message: "Message",
        submit: "Send via WhatsApp",
        privacyConsent: "I consent to privacy processing.",
      },
      validation: {
        fullName: "Please enter your full name.",
        phone: "Please enter a valid phone number.",
        petName: "Please enter your pet's name.",
        petType: "Please specify the pet type.",
        service: "Please select a service.",
        preferredDay: "Please choose a preferred day.",
        preferredTime: "Please choose a preferred time.",
        message: "Please leave a short message.",
        privacyConsent: "You must agree to privacy processing to continue.",
      },
    },
    blogPage: {
      title: "Blog",
      description: "Access helpful information for the long-term wellbeing of your companion animal.",
    },
    contactPage: {
      title: "Contact",
      description: "Reach out with questions, appointment requests, or feedback.",
    },
    footer: {
      title: "MeteVet Veterinary Clinic",
      description: "We provide modern, compassionate, and trustworthy veterinary care for companion animals.",
      navigation: "Pages",
      services: "Services",
      contact: "Contact",
      legal: "Legal",
      language: "Language",
      currentYear: "All rights reserved.",
    },
  },
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
