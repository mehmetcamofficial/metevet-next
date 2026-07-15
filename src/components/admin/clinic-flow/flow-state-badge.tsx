import type { ClinicFlowState } from "@/src/lib/admin/clinic-flow/clinic-flow";
import { flowStateLabels } from "@/src/lib/admin/clinic-flow/clinic-flow";

const icons: Record<ClinicFlowState, string> = {
  scheduled: "📅",
  checked_in: "🚪",
  waiting: "🪑",
  called: "📢",
  in_examination: "🩺",
  completed: "✔",
};

const styles: Record<ClinicFlowState, string> = {
  scheduled: "bg-slate-100 text-slate-800",
  checked_in: "bg-sky-100 text-sky-900",
  waiting: "bg-amber-100 text-amber-900",
  called: "bg-violet-100 text-violet-900",
  in_examination: "bg-teal-100 text-teal-900",
  completed: "bg-emerald-100 text-emerald-900",
};

export function FlowStateBadge({ state }: { state: ClinicFlowState }) {
  const label = flowStateLabels[state];
  return (
    <span
      aria-label={`Akış: ${label}`}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[state]}`}
    >
      <span aria-hidden="true">{icons[state]}</span>
      {label}
    </span>
  );
}
