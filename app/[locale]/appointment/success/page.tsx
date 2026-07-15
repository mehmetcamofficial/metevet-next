import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicBookingSuccessPage } from "@/src/components/public-booking/success-page";

const siteUrl = "https://metevet.com.tr";
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") notFound();
  return {
    metadataBase: new URL(siteUrl),
    title: "Appointment Request Received | MeteVet",
    description: "Your appointment request has been received successfully.",
    robots: { index: false, follow: false },
  };
}

export default async function EnglishSuccessRoute({ params }: Props) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  return <PublicBookingSuccessPage locale="en" />;
}
