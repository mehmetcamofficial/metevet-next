import type { VetAppointment } from "@/src/lib/admin/veterinarian/veterinarian-readers";
import { AppointmentStatusBadge } from "../appointments/appointment-status-badge";
import { ClinicFlowActions } from "../clinic-flow/clinic-flow-actions";
import { FlowStateBadge } from "../clinic-flow/flow-state-badge";
import { serviceLabels } from "@/src/lib/admin/appointments";
import {
  availableFlowActions,
  flowActionLabels,
  formatIstanbulTime,
  formatMinutesTr,
  isLongWait,
  waitingDurations,
} from "@/src/lib/admin/clinic-flow/clinic-flow";
import type { AppointmentStatus, UserRole } from "@/src/types/database";

type Props = {
  appointment: VetAppointment | null;
  role: UserRole;
  actorId: string;
};

export function NextPatientCard({ appointment, role, actorId }: Props) {
  if (!appointment) {
    return (
      <section
        className="rounded-2xl border-2 border-dashed border-[#D1DBD5] bg-white p-8 text-center"
        aria-label="Sıradaki hasta"
      >
        <h2 className="text-lg font-semibold text-[#526a64]">Sıradaki Hasta</h2>
        <p className="mt-2 text-sm text-[#95A8A2]">Şu anda bekleyen hasta yok.</p>
      </section>
    );
  }

  const durations = waitingDurations(appointment);
  const waitMins =
    appointment.flow_state === "called"
      ? durations.minutesSinceCalled
      : durations.minutesWaiting ?? durations.minutesSinceCheckIn;
  const longWait = isLongWait(waitMins);
  const actions = availableFlowActions(
    role,
    appointment.flow_state,
    appointment.status as AppointmentStatus,
    appointment.assigned_user_id,
    actorId,
  );

  return (
    <section
      className="rounded-2xl border-2 border-[#123A30] bg-[#DDE9E3] p-6"
      aria-label="Sıradaki hasta"
    >
      <h2 className="mb-4 text-lg font-semibold text-[#123A30]">🐾 Sıradaki Hasta</h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-bold">{formatIstanbulTime(appointment.starts_at)}</span>
            <FlowStateBadge state={appointment.flow_state} />
            <AppointmentStatusBadge status={appointment.status as AppointmentStatus} />
          </div>
          <p className="mt-2 text-xl font-semibold">{appointment.pet_name}</p>
          <p className="text-sm text-[#526a64]">
            {appointment.pet_species} · {appointment.owner_name}
          </p>
          <p className="mt-1 text-sm text-[#526a64]">
            {serviceLabels[appointment.service_key] ?? appointment.service_key}
          </p>
          {waitMins !== null && (
            <p
              className={`mt-2 text-sm ${longWait ? "font-semibold text-amber-900" : "text-[#526a64]"}`}
              aria-label={
                longWait
                  ? `Uzun bekleme: ${formatMinutesTr(waitMins)}`
                  : `Bekleme: ${formatMinutesTr(waitMins)}`
              }
            >
              {longWait ? "⏰ Uzun bekleme: " : "⏱ Bekleme: "}
              {formatMinutesTr(waitMins)}
            </p>
          )}
        </div>
        <div className="flex min-w-[12rem] flex-col gap-2">
          {/* Sticky primary clinical actions — labels include Muayeneyi Başlat / Hastayı Çağır */}
          <p className="sr-only">
            {flowActionLabels.call_patient} · {flowActionLabels.start_examination} · Randevu Detayı
          </p>
          <ClinicFlowActions
            appointmentId={appointment.id}
            flowState={appointment.flow_state}
            actions={actions}
            examinationId={appointment.examination_id}
          />
        </div>
      </div>
    </section>
  );
}
