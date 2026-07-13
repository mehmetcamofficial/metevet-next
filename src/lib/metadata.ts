import type { Metadata } from "next";
import type { Locale } from "@/types";

const siteUrl = "https://metevet.com.tr";

export function buildMetadata({
  locale,
  title,
  description,
  path = "/",
  image = "/images/onur-metehan-cakir.jpg",
}: {
  locale: Locale;
  title: string;
  description: string;
  path?: string;
  image?: string;
}) {
  const canonical = `${siteUrl}${locale === "tr" ? "" : `/${locale}`}${path === "/" ? "" : path}`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical,
      languages: {
        tr: `https://metevet.com.tr${path === "/" ? "" : path}`,
        en: `https://metevet.com.tr/en${path === "/" ? "" : path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "MeteVet Veteriner Kliniği",
      locale: locale === "tr" ? "tr_TR" : "en_US",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
    },
  } satisfies Metadata;
}
