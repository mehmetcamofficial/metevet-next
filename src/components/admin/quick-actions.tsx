import Link from "next/link";
import { canWriteClinicalRecords } from "@/src/lib/admin/permissions";
import type { UserRole } from "@/src/types/database";

type QuickAction = {
  href: string;
  label: string;
  icon: string;
  requiresWrite?: boolean;
};

const ACTIONS: QuickAction[] = [
  { href: "/admin/appointments/new", label: "Yeni Randevu", icon: "📅", requiresWrite: true },
  { href: "/admin/booking-settings/services/new", label: "Yeni Hizmet", icon: "🏥" },
  { href: "/admin/appointments?status=pending", label: "Bekleyen Talepler", icon: "⏳" },
  { href: "/admin/calendar", label: "Bugünün Takvimi", icon: "📆" },
  { href: "/admin/owners/new", label: "Yeni Hayvan Sahibi", icon: "👤", requiresWrite: true },
  { href: "/admin/pets/new", label: "Yeni Hayvan", icon: "🐾", requiresWrite: true },
  { href: "/admin/examinations/new", label: "Yeni Muayene", icon: "🩺", requiresWrite: true },
];

export function QuickActions({ role }: { role: UserRole }) {
  const canWrite = canWriteClinicalRecords(role);
  const filtered = ACTIONS.filter((a) => !a.requiresWrite || canWrite);

  return (
    <section aria-label="Hızlı İşlemler">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#526a64]">Hızlı İşlemler</h2>
      <div className="flex flex-wrap gap-2">
        {filtered.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#D1DBD5] bg-white px-4 py-2 text-sm font-medium text-[#0D2922] transition hover:border-[#123A30] hover:bg-[#DDE9E3]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30"
          >
            <span aria-hidden="true">{action.icon}</span>
            <span>{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
