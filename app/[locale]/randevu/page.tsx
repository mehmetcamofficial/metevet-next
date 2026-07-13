import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppointmentPage } from "@/src/components/appointment/appointment-page";

const siteUrl = "https://metevet.com.tr";
type AppointmentRouteProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: AppointmentRouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "tr") notFound();

  const title = "Randevu Talebi Oluştur | MeteVet";
  const description = "MeteVet Veteriner Kliniği için WhatsApp üzerinden güvenli ve hızlı bir randevu talebi oluşturun.";
  const canonical = `${siteUrl}/tr/randevu`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical,
      languages: { tr: canonical, en: `${siteUrl}/en/appointment` },
    },
    openGraph: { type: "website", url: canonical, title, description, locale: "tr_TR", siteName: "MeteVet Veteriner Kliniği" },
    twitter: { card: "summary", title, description },
  };
}

export default async function TurkishAppointmentRoute({ params }: AppointmentRouteProps) {
  const { locale } = await params;
  if (locale !== "tr") notFound();
  return <AppointmentPage locale="tr" />;
}
