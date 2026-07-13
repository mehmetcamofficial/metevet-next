import Link from "next/link";
import { notFound } from "next/navigation";
import { createPet } from "../actions";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { PetForm } from "@/src/components/admin/pets/pet-form";
import { canWriteClinicalRecords } from "@/src/lib/admin/permissions";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

export default async function NewPetPage() { const session = await requireStaff(); if (!canWriteClinicalRecords(session.profile.role)) notFound(); const supabase = await createClient(); const { data: owners } = supabase ? await supabase.from("owners").select("id, full_name, phone").is("archived_at", null).order("full_name") : { data: [] }; return <AdminShell session={session}><Link href="/admin/pets" className="text-sm underline">← Hayvanlar</Link><section className="mt-5 max-w-3xl rounded-2xl bg-white p-6"><h1 className="text-2xl font-semibold">Yeni Hayvan</h1>{owners?.length ? <div className="mt-7"><PetForm action={createPet} owners={owners} submitLabel="Kaydı Oluştur" /></div> : <p className="mt-5 rounded-lg bg-amber-50 p-4">Önce aktif bir hayvan sahibi kaydı oluşturun.</p>}</section></AdminShell>; }
