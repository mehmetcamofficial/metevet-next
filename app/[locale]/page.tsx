import { Hero } from "@/src/components/home/hero";
import { TrustStrip } from "@/src/components/home/trust-strip";
import { ServicesPreview } from "@/src/components/home/services-preview";
import { DoctorProfile } from "@/src/components/home/doctor-profile";
import { CarePhilosophy } from "@/src/components/home/care-philosophy";
import { AppointmentCTA } from "@/src/components/home/appointment-cta";
import { BlogPreview } from "@/src/components/home/blog-preview";
import { Faq } from "@/src/components/home/faq";
import { ContactPreview } from "@/src/components/home/contact-preview";
import { GallerySection } from "@/src/components/home/gallery-section";
import { Navbar } from "@/src/components/layout/navbar";
import { Footer } from "@/src/components/layout/footer";
import { WhatsappButton } from "@/src/components/shared/whatsapp-button";
import { SkipLink } from "@/src/components/shared/skip-link";
import { PageTransition } from "@/src/components/ui/page-transition";
import { JsonLd } from "@/src/components/seo/json-ld";
import { getDictionary, isLocale } from "@/src/lib/i18n";
import type { Locale } from "@/types";
import type { Metadata } from "next";
import { buildMetadata } from "@/src/lib/metadata";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const dict = getDictionary(resolvedLocale);

  return buildMetadata({
    locale: resolvedLocale,
    title: `MeteVet | ${dict.home.hero.title}`,
    description: dict.home.hero.description,
    path: resolvedLocale === "tr" ? "/" : "/en",
    image: "/images/onur-metehan-cakir.jpg",
  });
}

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: "MeteVet",
    url: "https://metevet.com.tr",
    telephone: "+905065859155",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kuşadası",
      addressRegion: "Aydın",
      addressCountry: "TR",
    },
    medicalSpecialty: "VeterinaryCare",
    description: "Premium veterinary care in Kuşadası.",
  };

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#0D2922]">
      <SkipLink />
      <Navbar locale={resolvedLocale} />
      <main id="main-content">
        <PageTransition>
          <Hero locale={resolvedLocale} />
          <TrustStrip locale={resolvedLocale} />
          <ServicesPreview locale={resolvedLocale} />
          <DoctorProfile locale={resolvedLocale} />
          <GallerySection />
          <CarePhilosophy locale={resolvedLocale} />
          <AppointmentCTA locale={resolvedLocale} />
          <BlogPreview locale={resolvedLocale} />
          <Faq locale={resolvedLocale} />
          <ContactPreview locale={resolvedLocale} />
          <JsonLd data={organizationJsonLd} />
        </PageTransition>
      </main>
      <Footer locale={resolvedLocale} />
      <WhatsappButton label={resolvedLocale === "tr" ? "WhatsApp" : "WhatsApp"} />
    </div>
  );
}
