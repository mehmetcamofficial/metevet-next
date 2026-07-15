import type { VetAppointment } from "@/src/lib/admin/veterinarian/veterinarian-readers";
import { AppointmentStatusBadge } from "../appointments/appointment-status-badge";
import { ClinicFlowActions } from "../clinic-flow/clinic-flow-actions";
import { FlowStateBadge } from "../clinic-flow/flow-state-badge";
import { serviceLabels } from "@/src/lib/admin/appointments";
import {
  availableFlowActions,
  formatIstanbulTime,
  formatMinutesTr,
  isLongWait,
  waitingDurations,
} from "@/src/lib/admin/clinic-flow/clinic-flow";
import type { AppointmentStatus, UserRole } from "@/src/types/database";

type Props = {
  appointments: VetAppointment[];
  role: UserRole;
  actorId: string;
};

function VetCard({
  a,
  role,
  actorId,
}: {
  a: VetAppointment;
  role: UserRole;
  actorId: string;
}) {
  const durations = waitingDurations(a);
  const waitMins =
    a.flow_state === "called"
      ? durations.minutesSinceCalled
      : durations.minutesWaiting ?? durations.minutesSinceCheckIn;
  const longWait = isLongWait(waitMins);
  const actions = availableFlowActions(
    role,
    a.flow_state,
    a.status as AppointmentStatus,
    a.assigned_user_id,
    actorId,
  );

  return (
    <article className="rounded-xl border border-[#D1DBD5] bg-white p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{formatIstanbulTime(a.starts_at)}</span>
            <span className="font-medium">{a.pet_name}</span>
            <FlowStateBadge state={a.flow_state} />
            <AppointmentStatusBadge status={a.status as AppointmentStatus} />
          </div>
          <p className="mt-1 text-sm text-[#526a64]">
            {a.pet_species} · {a.owner_name} · {serviceLabels[a.service_key] ?? a.service_key}
          </p>
          {waitMins !== null &&
            (a.flow_state === "waiting" || a.flow_state === "called" || a.flow_state === "checked_in") && (
              <p
                className={`mt-1 text-xs ${longWait ? "font-semibold text-amber-900" : "text-[#95A8A2]"}`}
                aria-label={
                  longWait
                    ? `Uzun bekleme: ${formatMinutesTr(waitMins)}`
                    : `Bekleme: ${formatMinutesTr(waitMins)}`
                }
              >
                {longWait ? "⏰ Uzun bekleme: " : "⏱ "}
                {formatMinutesTr(waitMins)}
              </p>
            )}
        </div>
        <ClinicFlowActions
          appointmentId={a.id}
          flowState={a.flow_state}
          actions={actions}
          examinationId={a.examination_id}
          compact
        />
      </div>
    </article>
  );
}

export function DailyPatientQueue({ appointments, role, actorId }: Props) {
  const waiting = appointments.filter(
    (a) => a.flow_state === "waiting" && a.status !== "cancelled" && a.status !== "no_show",
  );
  const called = appointments.filter(
    (a) => a.flow_state === "called" && a.status !== "cancelled" && a.status !== "no_show",
  );
  const inExam = appointments.filter(
    (a) => a.flow_state === "in_examination" && a.status !== "cancelled" && a.status !== "no_show",
  );
  const other = appointments.filter(
    (a) =>
      a.status !== "cancelled" &&
      a.status !== "no_show" &&
      !["waiting", "called", "in_examination", "completed"].includes(a.flow_state),
  );
  const completed = appointments.filter(
    (a) => a.status === "completed" || a.flow_state === "completed",
  );
  const cancelled = appointments.filter(
    (a) => a.status === "cancelled" || a.status === "no_show",
  );

  return (
    <div className="space-y-6">
      <section aria-label="Bekleme salonundaki hastalar">
        <h2 className="mb-3 text-sm font-semibold">
          Bekleme Salonunda ({waiting.length})
        </h2>
        {waiting.length > 0 ? (
          <div className="space-y-2">
            {waiting.map((a) => (
              <VetCard key={a.id} a={a} role={role} actorId={actorId} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-[#526a64]">
            Bekleme salonunda hasta yok.
          </p>
        )}
      </section>

      <section aria-label="Çağrılan hastalar">
        <h2 className="mb-3 text-sm font-semibold">
          Veteriner Çağırdı ({called.length})
        </h2>
        {called.length > 0 ? (
          <div className="space-y-2">
            {called.map((a) => (
              <VetCard key={a.id} a={a} role={role} actorId={actorId} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-white p-4 text-center text-sm text-[#95A8A2]">
            Çağrılan hasta yok.
          </p>
        )}
      </section>

      <section aria-label="Mevcut muayene">
        <h2 className="mb-3 text-sm font-semibold">Muayenede ({inExam.length})</h2>
        {inExam.length > 0 ? (
          <div className="space-y-2">
            {inExam.map((a) => (
              <VetCard key={a.id} a={a} role={role} actorId={actorId} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-white p-4 text-center text-sm text-[#95A8A2]">
            Aktif muayene yok.
          </p>
        )}
      </section>

      <section aria-label="Diğer randevular">
        <h2 className="mb-3 text-sm font-semibold">
          Diğer Randevular ({other.length})
        </h2>
        {other.length > 0 ? (
          <div className="space-y-2">
            {other.map((a) => (
              <VetCard key={a.id} a={a} role={role} actorId={actorId} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-white p-4 text-center text-sm text-[#95A8A2]">
            Ek randevu yok.
          </p>
        )}
      </section>

      {(completed.length > 0 || cancelled.length > 0) && (
        <details className="rounded-xl bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[#526a64]">
            Tamamlananlar / İptaller ({completed.length + cancelled.length})
          </summary>
          <div className="mt-3 space-y-2">
            {completed.map((a) => (
              <article
                key={a.id}
                className="rounded-xl border border-[#D1DBD5] bg-white p-3 opacity-70"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{formatIstanbulTime(a.starts_at)}</span>
                  <span>{a.pet_name}</span>
                  <FlowStateBadge state={a.flow_state} />
                  <AppointmentStatusBadge status={a.status as AppointmentStatus} />
                </div>
              </article>
            ))}
            {cancelled.map((a) => (
              <article
                key={a.id}
                className="rounded-xl border border-[#D1DBD5] bg-white p-3 opacity-70"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{formatIstanbulTime(a.starts_at)}</span>
                  <span>{a.pet_name}</span>
                  <AppointmentStatusBadge status={a.status as AppointmentStatus} />
                </div>
              </article>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
