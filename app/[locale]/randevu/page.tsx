import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicBookingWizardPage } from "@/src/components/public-booking/wizard-page";

const siteUrl = "https://metevet.com.tr";
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "tr") notFound();

  const title = "Online Randevu | MeteVet";
  const description = "MeteVet Veteriner Kliniği'nde online randevu alın. Hizmet seçin, uygun zamanı belirleyin ve randevu talebinizi oluşturun.";
  const canonical = `${siteUrl}/tr/randevu`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical,
      languages: { tr: canonical, en: `${siteUrl}/en/appointment` },
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      locale: "tr_TR",
      siteName: "MeteVet Veteriner Kliniği",
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function TurkishAppointmentRoute({ params }: Props) {
  const { locale } = await params;
  if (locale !== "tr") notFound();
  return <PublicBookingWizardPage locale="tr" />;
}
