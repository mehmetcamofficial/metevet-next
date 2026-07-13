"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/src/types/database";

const shared = [
  { href: "/admin", label: "Genel Bakış" }, { href: "/admin/owners", label: "Hayvan Sahipleri" },
  { href: "/admin/pets", label: "Hayvanlar" }, { href: "/admin/appointments", label: "Randevular" }, { href: "/admin/calendar", label: "Takvim" },
];
const comingSoon: Record<UserRole, string[]> = {
  admin: ["Personel", "Ayarlar", "Audit Log"], veterinarian: ["Muayeneler", "Aşı Takibi"], staff: [],
};
const roleLabels: Record<UserRole, string> = { admin: "Yönetici", veterinarian: "Veteriner Hekim", staff: "Personel" };

export function AdminSidebar({ role, open, onClose }: { role: UserRole; open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const content = <aside className="flex h-full w-72 max-w-[88vw] flex-col overflow-y-auto bg-[#0d2922] px-5 py-7 text-white lg:w-64">
    <div className="flex items-start justify-between"><div><Link href="/admin" onClick={onClose} className="rounded-md text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cda85f]">MeteVet</Link><p className="mt-1 text-xs text-white/65">Yönetim Paneli · {roleLabels[role]}</p></div><button onClick={onClose} className="rounded-lg border border-white/20 px-3 py-2 lg:hidden" aria-label="Yönetim menüsünü kapat">Kapat</button></div>
    <nav aria-label="Yönetim menüsü" className="mt-7 flex flex-col gap-1">{shared.map((link) => { const active = link.href === "/admin" ? pathname === link.href : pathname.startsWith(link.href); return <Link key={link.href} href={link.href} onClick={onClose} aria-current={active ? "page" : undefined} className={`rounded-lg px-3 py-2.5 text-sm transition focus-visible:outline-2 focus-visible:outline-[#cda85f] ${active ? "bg-white text-[#0d2922]" : "text-white/85 hover:bg-white/10"}`}>{link.label}</Link>; })}{comingSoon[role].map((label) => <span key={label} aria-disabled="true" className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2.5 text-sm text-white/45"><span>{label}</span><span className="text-[10px] uppercase">Yakında</span></span>)}</nav>
  </aside>;
  return <><div className="hidden shrink-0 lg:block">{content}</div>{open ? <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Yönetim menüsü"><button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="Menüyü kapat"/>{<div className="relative h-full w-fit">{content}</div>}</div> : null}</>;
}
