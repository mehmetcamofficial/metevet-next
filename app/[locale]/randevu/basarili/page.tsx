import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicBookingSuccessPage } from "@/src/components/public-booking/success-page";

const siteUrl = "https://metevet.com.tr";
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "tr") notFound();
  return {
    metadataBase: new URL(siteUrl),
    title: "Randevu Talebi Alındı | MeteVet",
    description: "Randevu talebiniz başarıyla alınmıştır.",
    robots: { index: false, follow: false },
  };
}

export default async function TurkishSuccessRoute({ params }: Props) {
  const { locale } = await params;
  if (locale !== "tr") notFound();
  return <PublicBookingSuccessPage locale="tr" />;
}
