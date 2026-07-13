import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { canWriteExamination, examinationStatusLabels } from "@/src/lib/admin/examinations";
import type { UserRole } from "@/src/types/database";

export async function AppointmentExamination({ appointmentId, petId, role }: { appointmentId: string; petId: string; role: UserRole }) {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("examinations").select("id, status, created_at").eq("appointment_id", appointmentId).order("created_at", { ascending: false }).limit(1).maybeSingle() : { data: null };
  return <section className="mt-6 rounded-2xl bg-white p-6"><h2 className="text-xl font-semibold">Bağlı Muayene</h2>{data ? <div className="mt-4"><Link className="font-semibold underline" href={`/admin/examinations/${data.id}`}>Muayene kaydını aç</Link><p className="mt-1 text-sm text-[#526a64]">{examinationStatusLabels[data.status]} · {new Intl.DateTimeFormat("tr-TR").format(new Date(data.created_at))}</p></div> : canWriteExamination(role) ? <Link href={`/admin/examinations/new?pet=${petId}&appointment=${appointmentId}`} className="mt-4 inline-flex rounded-lg bg-[#0d2922] px-4 py-2 text-white">Muayene Başlat</Link> : <p className="mt-4 text-sm text-[#526a64]">Bağlı muayene kaydı yok.</p>}</section>;
}
