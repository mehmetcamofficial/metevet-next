import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://metevet.com.tr"),
  title: "MeteVet | Premium Veterinary Care",
  description:
    "MeteVet offers premium veterinary care in Kuşadası with preventive medicine, diagnostics, and compassionate treatment for modern pet families.",
  keywords: [
    "premium veterinary clinic",
    "veterinary care Kuşadası",
    "pet clinic",
    "veterinarian Turkey",
    "pet wellness",
  ],
  alternates: {
    canonical: "https://metevet.com.tr",
    languages: {
      tr: "https://metevet.com.tr/tr",
      en: "https://metevet.com.tr/en",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "MeteVet | Premium Veterinary Care",
    description: "Luxury veterinary care built around prevention, trust, and modern medicine.",
    type: "website",
    locale: "en_US",
    siteName: "MeteVet",
    url: "https://metevet.com.tr",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "MeteVet Veterinary Clinic" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MeteVet | Premium Veterinary Care",
    description: "Luxury veterinary care built around prevention, trust, and modern medicine.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F4F0E8] text-[#0D2922]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
