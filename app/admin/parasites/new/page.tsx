import { notFound } from "next/navigation";
import { createParasite } from "../actions";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { ParasiteForm } from "@/src/components/admin/parasites/parasite-form";
import { canWritePreventive } from "@/src/lib/admin/preventive-care";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

export default async function Page({searchParams}:{searchParams:Promise<{pet?:string;vet?:string}>}) {
  const session=await requireStaff(); if(!canWritePreventive(session.profile.role))notFound(); const query=await searchParams,s=await createClient(); if(!s)notFound();
  const [owners,pets,vets]=await Promise.all([s.from("owners").select("id,full_name").is("archived_at",null).order("full_name"),s.from("pets").select("id,owner_id,name").is("archived_at",null).order("name"),s.from("profiles").select("id,full_name,role").eq("role","veterinarian").eq("status","active").order("full_name")]);
  return <AdminShell session={session}><h1 className="text-3xl font-semibold">Yeni Parazit Uygulaması</h1><section className="mt-6 rounded-2xl bg-white p-6"><ParasiteForm action={createParasite} owners={owners.data??[]} pets={pets.data??[]} vets={vets.data??[]} initial={{petId:query.pet??"",veterinarianId:query.vet??(session.profile.role==="veterinarian"?session.id:"")}}/></section></AdminShell>;
}
