import { notFound } from "next/navigation";
import { updateVaccine } from "../../actions";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { VaccineForm } from "@/src/components/admin/vaccines/vaccine-form";
import { canWritePreventive } from "@/src/lib/admin/preventive-care";
import { istanbulParts } from "@/src/lib/admin/appointments";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params, session=await requireStaff(); if(!canWritePreventive(session.profile.role))notFound(); const s=await createClient(); if(!s)notFound();
  const [record,owners,pets,vets]=await Promise.all([s.from("vaccination_records").select("*").eq("id",id).single(),s.from("owners").select("id,full_name").is("archived_at",null),s.from("pets").select("id,owner_id,name").is("archived_at",null),s.from("profiles").select("id,full_name,role").eq("role","veterinarian").eq("status","active")]);
  if(!record.data||record.data.archived_at)notFound(); const x=record.data,a=istanbulParts(x.administration_date),n=x.next_due_date?istanbulParts(x.next_due_date):null;
  return <AdminShell session={session}><h1 className="text-3xl">Aşı Kaydını Düzenle</h1><section className="mt-6 bg-white p-6"><VaccineForm action={updateVaccine.bind(null,id)} owners={owners.data??[]} pets={pets.data??[]} vets={vets.data??[]} initial={{ownerId:x.owner_id,petId:x.pet_id,veterinarianId:x.veterinarian_id,vaccineName:x.vaccine_name,manufacturer:x.manufacturer,batchNumber:x.batch_number,serialNumber:x.serial_number,doseNumber:x.dose_number,route:x.route,administrationDate:`${a.date}T${a.time}`,nextDueDate:n?`${n.date}T${n.time}`:"",status:x.status,certificateNumber:x.certificate_number,notes:x.notes,internalNotes:x.internal_notes}}/></section></AdminShell>;
}
