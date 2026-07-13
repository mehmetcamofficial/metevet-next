import { statusLabels } from "@/src/lib/admin/appointments";
import type { AppointmentStatus } from "@/src/types/database";
const colors: Record<AppointmentStatus, string> = { pending: "bg-amber-100 text-amber-900", confirmed: "bg-blue-100 text-blue-900", completed: "bg-emerald-100 text-emerald-900", cancelled: "bg-stone-200 text-stone-800", no_show: "bg-red-100 text-red-900" };
export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) { return <span aria-label={`Durum: ${statusLabels[status]}`} className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status]}`}>{statusLabels[status]}</span>; }
