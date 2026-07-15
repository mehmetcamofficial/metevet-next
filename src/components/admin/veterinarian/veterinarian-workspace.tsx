import { VeterinarianMetrics } from "./veterinarian-metrics";
import { NextPatientCard } from "./next-patient-card";
import { DailyPatientQueue } from "./daily-patient-queue";
import type { VetAppointment, VetMetrics } from "@/src/lib/admin/veterinarian/veterinarian-readers";
import type { UserRole } from "@/src/types/database";

type VeterinarianWorkspaceProps = {
  appointments: VetAppointment[];
  metrics: VetMetrics;
  nextPatient: VetAppointment | null;
  role: UserRole;
  actorId: string;
};

export function VeterinarianWorkspace({
  appointments,
  metrics,
  nextPatient,
  role,
  actorId,
}: VeterinarianWorkspaceProps) {
  return (
    <div className="space-y-6">
      <VeterinarianMetrics metrics={metrics} />
      <NextPatientCard appointment={nextPatient} role={role} actorId={actorId} />
      <DailyPatientQueue appointments={appointments} role={role} actorId={actorId} />
    </div>
  );
}
