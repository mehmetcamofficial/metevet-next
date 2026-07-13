import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Yönetim Paneli | MeteVet",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
