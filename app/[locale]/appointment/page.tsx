import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicBookingWizardPage } from "@/src/components/public-booking/wizard-page";

const siteUrl = "https://metevet.com.tr";
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") notFound();

  const title = "Online Appointment | MeteVet";
  const description = "Book an online appointment at MeteVet Veterinary Clinic. Select a service, choose an available time, and submit your appointment request.";
  const canonical = `${siteUrl}/en/appointment`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical,
      languages: { tr: `${siteUrl}/tr/randevu`, en: canonical },
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      locale: "en_US",
      siteName: "MeteVet Veterinary Clinic",
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function EnglishAppointmentRoute({ params }: Props) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  return <PublicBookingWizardPage locale="en" />;
}
