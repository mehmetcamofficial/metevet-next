import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePet } from "../../actions";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { PetForm } from "@/src/components/admin/pets/pet-form";
import { canWriteClinicalRecords } from "@/src/lib/admin/permissions";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

export default async function EditPetPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const session = await requireStaff(); if (!canWriteClinicalRecords(session.profile.role)) notFound(); const supabase = await createClient(); if (!supabase) notFound(); const [petResult, ownersResult] = await Promise.all([supabase.from("pets").select("owner_id, name, species, breed, sex, birth_date, microchip_number, notes").eq("id", id).single(), supabase.from("owners").select("id, full_name, phone").is("archived_at", null).order("full_name")]); if (!petResult.data) notFound(); return <AdminShell session={session}><Link href={`/admin/pets/${id}`} className="text-sm underline">← Kayıt detayı</Link><section className="mt-5 max-w-3xl rounded-2xl bg-white p-6"><h1 className="text-2xl font-semibold">Hayvan Kaydını Düzenle</h1><div className="mt-7"><PetForm action={updatePet.bind(null, id)} pet={petResult.data} owners={ownersResult.data ?? []} submitLabel="Değişiklikleri Kaydet" /></div></section></AdminShell>; }
