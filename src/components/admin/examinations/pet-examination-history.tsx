import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { canWriteExamination, examinationStatusLabels } from "@/src/lib/admin/examinations";
import type { UserRole } from "@/src/types/database";

export async function PetExaminationHistory({ petId, role }: { petId: string; role: UserRole }) {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("examinations").select("id, created_at, status, diagnosis, veterinarian_id").eq("pet_id", petId).order("created_at", { ascending: false }).limit(8) : { data: [] };
  const ids = [...new Set(data?.map((item) => item.veterinarian_id) ?? [])];
  const vets = supabase && ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const names = new Map(vets.data?.map((vet) => [vet.id, vet.full_name]));
  return <section className="mt-6 rounded-2xl bg-white p-6"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-semibold">Muayene Geçmişi</h2>{canWriteExamination(role) ? <Link href={`/admin/examinations/new?pet=${petId}`} className="rounded-lg bg-[#0d2922] px-4 py-2 text-sm text-white">Yeni Muayene</Link> : null}</div>{data?.length ? <ul className="mt-4 divide-y">{data.map((item) => <li key={item.id} className="py-3"><Link href={`/admin/examinations/${item.id}`} className="font-medium hover:underline">{new Intl.DateTimeFormat("tr-TR").format(new Date(item.created_at))} · {examinationStatusLabels[item.status]}</Link><p className="mt-1 text-sm text-[#526a64]">{names.get(item.veterinarian_id) ?? "—"} · {item.diagnosis ? `${item.diagnosis.slice(0, 120)}${item.diagnosis.length > 120 ? "…" : ""}` : "Tanı özeti yok"}</p></li>)}</ul> : <p className="mt-4 text-sm text-[#526a64]">Henüz muayene kaydı yok.</p>}</section>;
}
