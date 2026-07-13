export type Locale = "tr" | "en";

export type SiteContent = {
  nav: {
    home: string;
    about: string;
    services: string;
    blog: string;
    contact: string;
    appointment: string;
  };
  common: {
    appointmentCta: string;
    whatsapp: string;
    callNow: string;
    bookNow: string;
    learnMore: string;
    viewAll: string;
    readMore: string;
    disclaimer: string;
    privacyConsent: string;
  };
  home: {
    hero: {
      eyebrow: string;
      title: string;
      description: string;
      primaryCta: string;
      secondaryCta: string;
    };
    trustStrip: string[];
    services: {
      title: string;
      description: string;
      linkLabel: string;
    };
    doctor: {
      title: string;
      description: string;
      label: string;
      biography: string;
    };
    philosophy: {
      title: string;
      description: string;
      items: Array<{ title: string; description: string }>;
    };
    appointment: {
      title: string;
      description: string;
      phoneLabel: string;
      whatsappLabel: string;
      pageLabel: string;
    };
    blog: {
      title: string;
      description: string;
      viewAll: string;
    };
    faq: {
      title: string;
      description: string;
    };
    contact: {
      title: string;
      description: string;
    };
  };
  about: {
    title: string;
    description: string;
    intro: string;
    bullets: Array<{ title: string; description: string }>;
  };
  servicesPage: {
    title: string;
    description: string;
  };
  appointmentPage: {
    title: string;
    description: string;
    notice: string;
    form: {
      fullName: string;
      phone: string;
      petName: string;
      petType: string;
      service: string;
      preferredDay: string;
      preferredTime: string;
      message: string;
      submit: string;
      privacyConsent: string;
    };
    validation: Record<string, string>;
  };
  blogPage: {
    title: string;
    description: string;
  };
  contactPage: {
    title: string;
    description: string;
  };
  footer: {
    title: string;
    description: string;
    navigation: string;
    services: string;
    contact: string;
    legal: string;
    language: string;
    currentYear: string;
  };
};

export type ServiceItem = {
  title: string;
  titleEn?: string;
  description: string;
  icon: string;
  href: string;
};

export type BlogPost = {
  slug: string;
  locale: Locale;
  translationSlug: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  featured: boolean;
  tags: string[];
  sections: Array<{
    id: string;
    title: string;
    paragraphs: string[];
    tone?: "default" | "information" | "warning";
  }>;
  tableOfContents: Array<{ id: string; title: string }>;
  relatedSlugs: string[];
  publishedAt: string;
  updatedAt: string;
  author: string;
  category: string;
  readingTime: string;
  keywords: string[];
};

export type FaqItem = {
  question: string;
  answer: string;
};
