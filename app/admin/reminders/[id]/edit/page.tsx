import { notFound } from "next/navigation";
import { updateReminder } from "../../actions";
import { ReminderForm } from "@/src/components/admin/reminders/reminder-form";
import { istanbulParts } from "@/src/lib/admin/appointments";
import { canManageReminders } from "@/src/lib/admin/reminders/reminder-permissions";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

export default async function Page({params}:{params:Promise<{id:string}>}) {
  const{id}=await params,session=await requireStaff();if(!canManageReminders(session.profile.role))notFound();const s=await createClient();if(!s)notFound();
  const[x,owners,pets]=await Promise.all([s.from("reminders").select("*").eq("id",id).single(),s.from("owners").select("id,full_name"),s.from("pets").select("id,name,owner_id")]);
  if(!x.data||!["pending","ready","failed"].includes(x.data.status))notFound();const local=istanbulParts(x.data.scheduled_for);
  return <><h1 className="text-3xl font-semibold">Hatırlatmayı Düzenle</h1><ReminderForm action={updateReminder.bind(null,id)} owners={owners.data??[]} pets={pets.data??[]} relationshipLocked initial={{ownerId:x.data.owner_id,petId:x.data.pet_id,reminderType:x.data.reminder_type,channel:x.data.channel,scheduledFor:`${local.date}T${local.time}`,renderedMessage:x.data.rendered_message}}/></>;
}
