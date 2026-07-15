import { VeterinarianMetrics } from "./veterinarian-metrics";
import { NextPatientCard } from "./next-patient-card";
import { DailyPatientQueue } from "./daily-patient-queue";
import type { VetAppointment, VetMetrics } from "@/src/lib/admin/veterinarian/veterinarian-readers";

type VeterinarianWorkspaceProps = {
  appointments: VetAppointment[];
  metrics: VetMetrics;
  nextPatient: VetAppointment | null;
};

export function VeterinarianWorkspace({ appointments, metrics, nextPatient }: VeterinarianWorkspaceProps) {
  return (
    <div className="space-y-6">
      {/* Metrics */}
      <VeterinarianMetrics metrics={metrics} />

      {/* Next Patient */}
      <NextPatientCard appointment={nextPatient} />

      {/* Daily Queue */}
      <DailyPatientQueue appointments={appointments} />
    </div>
  );
}
