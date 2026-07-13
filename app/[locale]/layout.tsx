import { notFound } from "next/navigation";
import { isLocale } from "@/src/lib/i18n";
import { buildMetadata } from "@/src/lib/metadata";
import type { Locale } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolvedLocale = isLocale(locale) ? locale : "tr";

  return buildMetadata({
    locale: resolvedLocale as Locale,
    title: resolvedLocale === "tr" ? "MeteVet Veteriner Kliniği | Premium Veteriner Bakım" : "MeteVet Veterinary Clinic | Premium Veterinary Care",
    description: resolvedLocale === "tr" ? "Kuşadası'ndaki MeteVet Veteriner Kliniği, koruyucu hekimlikten tanı ve tedaviye kadar premium veteriner bakım sunar." : "MeteVet Veterinary Clinic in Kuşadası offers premium veterinary care from preventive medicine to diagnosis and treatment.",
    image: "/opengraph-image",
  });
}

export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return children;
}
