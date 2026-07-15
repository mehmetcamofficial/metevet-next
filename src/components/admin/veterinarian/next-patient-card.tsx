import Link from "next/link";
import type { VetAppointment } from "@/src/lib/admin/veterinarian/veterinarian-readers";
import { AppointmentStatusBadge } from "../appointments/appointment-status-badge";
import { serviceLabels } from "@/src/lib/admin/appointments";
import type { AppointmentStatus } from "@/src/types/database";

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function NextPatientCard({ appointment }: { appointment: VetAppointment | null }) {
  if (!appointment) {
    return (
      <section className="rounded-2xl border-2 border-dashed border-[#D1DBD5] bg-white p-8 text-center" aria-label="Sıradaki hasta">
        <h2 className="text-lg font-semibold text-[#526a64]">Sıradaki Hasta</h2>
        <p className="mt-2 text-sm text-[#95A8A2]">Şu anda bekleyen hasta yok.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border-2 border-[#123A30] bg-[#DDE9E3] p-6" aria-label="Sıradaki hasta">
      <h2 className="mb-4 text-lg font-semibold text-[#123A30]">🐾 Sıradaki Hasta</h2>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{formatTime(appointment.starts_at)}</span>
            <AppointmentStatusBadge status={appointment.status as AppointmentStatus} />
          </div>
          <p className="mt-2 text-xl font-semibold">{appointment.pet_name}</p>
          <p className="text-sm text-[#526a64]">{appointment.pet_species} · {appointment.owner_name}</p>
          <p className="mt-1 text-sm text-[#526a64]">{serviceLabels[appointment.service_key] ?? appointment.service_key}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Link href={`/admin/appointments/${appointment.id}`} className="rounded-lg border border-[#123A30] px-4 py-2 text-sm font-medium text-[#123A30] hover:bg-white">
            Randevu Detayı
          </Link>
          <Link href={`/admin/pets/${appointment.pet_id}`} className="rounded-lg border border-[#123A30] px-4 py-2 text-sm font-medium text-[#123A30] hover:bg-white">
            Hasta Kaydı
          </Link>
          <Link href={`/admin/examinations/new?appointment_id=${appointment.id}`} className="rounded-lg bg-[#123A30] px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
            Muayeneyi Başlat
          </Link>
        </div>
      </div>
    </section>
  );
}
