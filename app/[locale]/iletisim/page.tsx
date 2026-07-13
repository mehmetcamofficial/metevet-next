import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactPage } from "@/src/components/contact/contact-page";
import { buildMetadata } from "@/src/lib/metadata";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "tr") notFound();

  return buildMetadata({
    locale: "tr",
    title: "İletişim | MeteVet",
    description: "Kuşadası, Aydın'daki MeteVet Veteriner Kliniği ile telefon veya WhatsApp üzerinden iletişime geçin.",
    path: "/iletisim",
  });
}

export default async function TurkishContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  if (locale !== "tr") notFound();

  return <ContactPage locale="tr" />;
}
