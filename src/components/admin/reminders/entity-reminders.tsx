import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { ReminderStatusBadge } from "./reminder-status-badge";
import { ReminderTypeBadge } from "./reminder-type-badge";

export async function EntityReminders({ ownerId, petId }: { ownerId?: string; petId?: string }) {
  const s = await createClient(); if (!s) return null;
  let query = s.from("reminders").select("id,scheduled_for,reminder_type,status");
  query = petId ? query.eq("pet_id", petId) : query.eq("owner_id", ownerId!);
  const { data } = await query.order("scheduled_for", { ascending: false }).limit(10);
  return <section className="mt-6 rounded-2xl bg-white p-6"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-semibold">Hatırlatma Geçmişi</h2><Link href={`/admin/reminders/new?${petId ? `pet=${petId}&owner=${ownerId}` : `owner=${ownerId}`}`} className="rounded border px-3 py-1 text-sm">İletişim / Hatırlatma</Link></div>{data?.length ? <ul className="mt-4 divide-y">{data.map((x) => <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><Link href={`/admin/reminders/${x.id}`} className="font-medium underline">{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(x.scheduled_for))}</Link><div className="mt-2"><ReminderTypeBadge type={x.reminder_type} /></div></div><ReminderStatusBadge status={x.status} /></li>)}</ul> : <p className="mt-4 text-sm text-[#526a64]">Henüz hatırlatma kaydı yok.</p>}</section>;
}
