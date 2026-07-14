import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ReminderType } from "@/src/types/database";
import { renderReminderTemplate } from "./render-template";
import { normalizeRecipientPhone } from "./normalize-recipient";
import { istanbulParts, REMINDER_LEAD_TIMES, scheduleBefore } from "./scheduling";

type Client = SupabaseClient<Database>;
type Candidate = Database["public"]["Tables"]["reminders"]["Insert"];
const clinic = { clinic_name: "MeteVet Veteriner Kliniği", clinic_phone: "+90 506 585 91 55" };

export async function generateReminderBatch(s: Client, actorId: string, now = new Date()) {
  const horizon = new Date(now.getTime() + 31 * 864e5).toISOString();
  const [appointments, vaccines, parasites, examinations, templates] = await Promise.all([
    s.from("appointments").select("id,owner_id,pet_id,starts_at,service_key,status").neq("status","cancelled").gte("starts_at",now.toISOString()).lte("starts_at",horizon),
    s.from("vaccination_records").select("id,owner_id,pet_id,next_due_date,archived_at").is("archived_at",null).not("next_due_date","is",null).lte("next_due_date",horizon),
    s.from("parasite_records").select("id,owner_id,pet_id,next_due_date,archived_at").is("archived_at",null).not("next_due_date","is",null).lte("next_due_date",horizon),
    s.from("examinations").select("id,owner_id,pet_id,follow_up_at,status").neq("status","archived").not("follow_up_at","is",null).lte("follow_up_at",horizon),
    s.from("reminder_templates").select("key,body").eq("language","tr").eq("is_active",true),
  ]);
  const ownerIds = new Set<string>(); const petIds = new Set<string>();
  for (const list of [appointments.data, vaccines.data, parasites.data, examinations.data]) for (const row of list ?? []) { ownerIds.add(row.owner_id); petIds.add(row.pet_id); }
  const [owners, pets] = await Promise.all([
    ownerIds.size ? s.from("owners").select("id,full_name,phone,email").in("id",[...ownerIds]) : Promise.resolve({data:[]}),
    petIds.size ? s.from("pets").select("id,name").in("id",[...petIds]) : Promise.resolve({data:[]}),
  ]);
  const om = new Map((owners.data ?? []).map(x => [x.id,x])); const pm = new Map((pets.data ?? []).map(x => [x.id,x]));
  const tm = new Map((templates.data ?? []).map(x => [x.key,x.body])); const candidates: Candidate[] = [];
  const add = (type: ReminderType, ownerId: string, petId: string, sourceDate: string, source: Partial<Candidate>, lead: number, service = "") => {
    const owner=om.get(ownerId),pet=pm.get(petId), parts=istanbulParts(sourceDate), key=`${type}_tr`, body=tm.get(key); if(!owner||!pet||!body||!normalizeRecipientPhone(owner.phone))return;
    candidates.push({owner_id:ownerId,pet_id:petId,reminder_type:type,channel:"whatsapp",status:"pending",scheduled_for:scheduleBefore(sourceDate,lead),recipient_name:owner.full_name,recipient_phone:owner.phone,recipient_email:owner.email,message_template_key:key,rendered_message:renderReminderTemplate(body,{...clinic,owner_name:owner.full_name,pet_name:pet.name,date:parts.date,time:parts.time,service}),created_by:actorId,...source});
  };
  for(const x of appointments.data??[]){add("appointment_upcoming",x.owner_id,x.pet_id,x.starts_at,{appointment_id:x.id},REMINDER_LEAD_TIMES.appointment_upcoming,x.service_key);add("appointment_same_day",x.owner_id,x.pet_id,x.starts_at,{appointment_id:x.id},REMINDER_LEAD_TIMES.appointment_same_day,x.service_key);}
  for(const x of vaccines.data??[]){const d=x.next_due_date!;add(new Date(d)<now?"vaccine_overdue":"vaccine_due",x.owner_id,x.pet_id,d,{vaccine_record_id:x.id},new Date(d)<now?0:REMINDER_LEAD_TIMES.vaccine_due);}
  for(const x of parasites.data??[]){const d=x.next_due_date!;add(new Date(d)<now?"parasite_overdue":"parasite_due",x.owner_id,x.pet_id,d,{parasite_record_id:x.id},new Date(d)<now?0:REMINDER_LEAD_TIMES.parasite_due);}
  for(const x of examinations.data??[])add("follow_up_due",x.owner_id,x.pet_id,x.follow_up_at!,{examination_id:x.id},REMINDER_LEAD_TIMES.follow_up_due);
  let created=0; for(const candidate of candidates){const {error}=await s.from("reminders").insert(candidate);if(!error)created++;else if(error.code!=="23505")throw new Error("Hatırlatmalar oluşturulamadı.");}
  return {created, considered:candidates.length};
}
