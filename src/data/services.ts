import { ArrowRightLeft, BriefcaseMedical, Microscope, Stethoscope, Sparkles, ShieldCheck } from "lucide-react";
import type { ServiceItem } from "@/types";

export const services: ServiceItem[] = [
  {
    title: "Genel Muayene",
    description: "Düzenli sağlık değerlendirmeleri ve kişiselleştirilmiş bakım planları.",
    icon: "Stethoscope",
    href: "/tr/hizmetler",
  },
  {
    title: "Aşı ve Koruyucu Hekimlik",
    description: "Koruyucu müdahaleler, aşı takibi ve yaşam evresi uyumlu planlar.",
    icon: "ShieldCheck",
    href: "/tr/hizmetler",
  },
  {
    title: "Laboratuvar ve Tanı",
    description: "Hızlı ve güvenilir tanı süreçleriyle net kararlar sunuyoruz.",
    icon: "Microscope",
    href: "/tr/hizmetler",
  },
  {
    title: "Cerrahi İşlemler",
    description: "Modern yaklaşım ve dikkatli süreç yönetimi ile cerrahi bakım sunuyoruz.",
    icon: "BriefcaseMedical",
    href: "/tr/hizmetler",
  },
  {
    title: "Diş ve Ağız Sağlığı",
    description: "Ağız sağlığını korumak için nazik ve kapsamlı değerlendirmeler.",
    icon: "Sparkles",
    href: "/tr/hizmetler",
  },
  {
    title: "Acil Değerlendirme",
    description: "İhtiyaç duyulduğunda hızlı yönlendirme ve düzenli takip desteği.",
    icon: "ArrowRightLeft",
    href: "/tr/hizmetler",
  },
];

export const serviceIcons = {
  Stethoscope,
  ShieldCheck,
  Microscope,
  BriefcaseMedical,
  Sparkles,
  ArrowRightLeft,
};
