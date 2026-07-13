import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppointmentPage } from "@/src/components/appointment/appointment-page";

const siteUrl = "https://metevet.com.tr";
type AppointmentRouteProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: AppointmentRouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") notFound();

  const title = "Request an Appointment | MeteVet";
  const description = "Create a clear appointment request for MeteVet Veterinary Clinic and send it securely through WhatsApp.";
  const canonical = `${siteUrl}/en/appointment`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical,
      languages: { tr: `${siteUrl}/tr/randevu`, en: canonical },
    },
    openGraph: { type: "website", url: canonical, title, description, locale: "en_US", siteName: "MeteVet Veterinary Clinic" },
    twitter: { card: "summary", title, description },
  };
}

export default async function EnglishAppointmentRoute({ params }: AppointmentRouteProps) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  return <AppointmentPage locale="en" />;
}
