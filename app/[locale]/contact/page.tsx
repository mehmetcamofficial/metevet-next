import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactPage } from "@/src/components/contact/contact-page";
import { buildMetadata } from "@/src/lib/metadata";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") notFound();

  return buildMetadata({
    locale: "en",
    title: "Contact | MeteVet",
    description: "Contact MeteVet Veterinary Clinic in Kuşadası, Aydın by phone or WhatsApp.",
    path: "/contact",
  });
}

export default async function EnglishContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  if (locale !== "en") notFound();

  return <ContactPage locale="en" />;
}
