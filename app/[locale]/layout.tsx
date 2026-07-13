import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import "../globals.css";
import { isLocale } from "@/src/lib/i18n";
import { buildMetadata } from "@/src/lib/metadata";
import type { Locale } from "@/types";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolvedLocale = isLocale(locale) ? locale : "tr";

  return buildMetadata({
    locale: resolvedLocale as Locale,
    title: resolvedLocale === "tr" ? "MeteVet Veteriner Kliniği | Premium Veteriner Bakım" : "MeteVet Veterinary Clinic | Premium Veterinary Care",
    description: resolvedLocale === "tr" ? "Kuşadası'ndaki MeteVet Veteriner Kliniği, koruyucu hekimlikten tanı ve tedaviye kadar premium veteriner bakım sunar." : "MeteVet Veterinary Clinic in Kuşadası offers premium veterinary care from preventive medicine to diagnosis and treatment.",
    image: "/images/onur-metehan-cakir.jpg",
  });
}

export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const cookieStore = await cookies();
  const direction = cookieStore.get("dir")?.value ?? "ltr";

  return (
    <html lang={locale} dir={direction} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#F4F0E8] text-[#0D2922]">{children}</body>
    </html>
  );
}
