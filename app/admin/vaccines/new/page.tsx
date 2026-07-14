import { notFound } from "next/navigation";
import { createVaccine } from "../actions";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { VaccineForm } from "@/src/components/admin/vaccines/vaccine-form";
import { canWritePreventive } from "@/src/lib/admin/preventive-care";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

export default async function Page({ searchParams }: { searchParams: Promise<{ pet?: string; vet?: string; appointment?: string }> }) {
  const session = await requireStaff(); if (!canWritePreventive(session.profile.role)) notFound();
  const query = await searchParams; const s = await createClient(); if (!s) notFound();
  const [owners, pets, vets] = await Promise.all([
    s.from("owners").select("id,full_name").is("archived_at",null).order("full_name"),
    s.from("pets").select("id,owner_id,name").is("archived_at",null).order("name"),
    s.from("profiles").select("id,full_name,role").eq("role","veterinarian").eq("status","active").order("full_name"),
  ]);
  return <AdminShell session={session}><h1 className="text-3xl font-semibold">Yeni Aşı Kaydı</h1><section className="mt-6 rounded-2xl bg-white p-6"><VaccineForm action={createVaccine} owners={owners.data??[]} pets={pets.data??[]} vets={vets.data??[]} initial={{petId:query.pet??"",veterinarianId:query.vet??(session.profile.role==="veterinarian"?session.id:""),appointmentId:query.appointment??""}}/></section></AdminShell>;
}
