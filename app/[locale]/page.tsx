import { CinematicHero } from "@/src/components/cinematic/CinematicHero";
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
import { WebGLProvider } from "@/src/components/webgl/WebGLProvider";
import { InteractiveClinicLoader } from "@/src/components/interactive-clinic/InteractiveClinicLoader";
import { HomepageCompanionLayer } from "@/src/components/webgl/companion/HomepageCompanionLayer";

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
      <HomepageCompanionLayer locale={resolvedLocale} />
      <main id="main-content">
        <PageTransition>
          <CinematicHero locale={resolvedLocale} />
          <div id="home-content">
            <div data-home-section="journey">
              <WebGLProvider
              scene="clinic"
              journey
              poster="/images/clinic/clinic-exam-room.png"
              posterAlt={resolvedLocale === "tr" ? "MeteVet klinik alanları" : "MeteVet clinic spaces"}
              journeyCopy={
                resolvedLocale === "tr"
                  ? [
                      {
                        title: "MeteVet’in kapısından içeri adım atın.",
                        supporting: "Her ziyaret, güven ve şefkatle karşılanır.",
                      },
                      { title: "Her muayene dikkatle başlar.", supporting: "Sakin, özenli ve kişisel bir değerlendirme." },
                      { title: "Bilimsel yaklaşım, güvenli kararlar.", supporting: "Modern klinik olanaklar doğru kararı destekler." },
                      { title: "İyileşme, huzurlu bir ortamda devam eder.", supporting: "Konfor, bakım sürecinin önemli bir parçasıdır." },
                      { title: "Bize ulaşmak çok kolay.", supporting: "Kuşadası’ndaki kliniğimize yolculuğunuzu planlayın." },
                    ]
                  : [
                      {
                        title: "Step inside MeteVet.",
                        supporting: "Every visit begins with trust and compassion.",
                      },
                      { title: "Every examination begins with attention.", supporting: "A calm, careful and personal assessment." },
                      { title: "Scientific insight, confident decisions.", supporting: "Modern clinical tools support informed care." },
                      { title: "Recovery continues in a calm environment.", supporting: "Comfort is an essential part of care." },
                      { title: "Finding us is easy.", supporting: "Plan your journey to our Kuşadası clinic." },
                    ]
              }
              >
                <InteractiveClinicLoader locale={resolvedLocale} />
              </WebGLProvider>
            </div>
            <div data-home-section="trust"><TrustStrip locale={resolvedLocale} /></div>
            <div data-home-section="services"><ServicesPreview locale={resolvedLocale} /></div>
            <div data-home-section="doctor"><DoctorProfile locale={resolvedLocale} /></div>
            <div data-home-section="gallery"><GallerySection /></div>
            <div data-home-section="philosophy"><CarePhilosophy locale={resolvedLocale} /></div>
            <div data-home-section="appointment"><AppointmentCTA locale={resolvedLocale} /></div>
            <div data-home-section="blog"><BlogPreview locale={resolvedLocale} /></div>
            <div data-home-section="faq"><Faq locale={resolvedLocale} /></div>
            <div data-home-section="contact"><ContactPreview locale={resolvedLocale} /></div>
            <JsonLd data={organizationJsonLd} />
          </div>
        </PageTransition>
      </main>
      <div data-home-section="footer"><Footer locale={resolvedLocale} /></div>
      <WhatsappButton label={resolvedLocale === "tr" ? "WhatsApp" : "WhatsApp"} />
    </div>
  );
}
