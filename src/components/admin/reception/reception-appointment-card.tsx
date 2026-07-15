import Link from "next/link";
import { AppointmentStatusBadge } from "../appointments/appointment-status-badge";
import { serviceLabels, sourceLabels } from "@/src/lib/admin/appointments";
import type { AppointmentStatus, AppointmentSource } from "@/src/types/database";

type ReceptionAppointment = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  source: string;
  service_key: string;
  assigned_user_id: string | null;
  requested_veterinarian_id: string | null;
  public_booking_reference: string | null;
  phone: string;
  owner_name: string;
  pet_name: string;
  vet_name: string | null;
};

function statusIcon(status: string): string {
  switch (status) {
    case "pending": return "⏳";
    case "confirmed": return "✅";
    case "completed": return "✔";
    case "cancelled": return "❌";
    case "no_show": return "🚫";
    default: return "📋";
  }
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function ReceptionAppointmentCard({ item }: { item: ReceptionAppointment }) {
  const isPending = item.status === "pending";
  const isUnassigned = !item.assigned_user_id;

  return (
    <article
      className={`rounded-xl border p-3 ${isPending ? "border-amber-300 bg-amber-50" : isUnassigned ? "border-orange-300 bg-orange-50" : "border-[#D1DBD5] bg-white"}`}
      aria-label={`${formatTime(item.starts_at)} - ${item.pet_name}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span>{statusIcon(item.status)}</span>
            <span className="font-semibold">{formatTime(item.starts_at)}</span>
            <span className="font-medium">{item.pet_name}</span>
          </div>
          <p className="mt-1 text-sm text-[#526a64]">
            {item.owner_name} · {serviceLabels[item.service_key] ?? item.service_key}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#95A8A2]">
            {item.vet_name && <span>👨‍⚕️ {item.vet_name}</span>}
            <span>{sourceLabels[item.source as AppointmentSource] ?? item.source}</span>
            {item.public_booking_reference && <span className="font-mono">{item.public_booking_reference}</span>}
            {isPending && <span className="rounded bg-amber-200 px-1.5 py-0.5 text-amber-800">Bekleyen</span>}
            {isUnassigned && <span className="rounded bg-orange-200 px-1.5 py-0.5 text-orange-800">Atanmamış</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <AppointmentStatusBadge status={item.status as AppointmentStatus} />
          <Link href={`/admin/appointments/${item.id}`} className="text-xs text-[#123A30] underline hover:no-underline">
            Detay
          </Link>
          {item.phone && (
            <a href={`tel:${item.phone}`} className="text-xs text-[#123A30] underline hover:no-underline" aria-label="Telefon et">
              📞 Ara
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
