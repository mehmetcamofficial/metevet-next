import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOwner } from "../../actions";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { OwnerForm } from "@/src/components/admin/owners/owner-form";
import { canWriteClinicalRecords } from "@/src/lib/admin/permissions";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

export default async function EditOwnerPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const session = await requireStaff(); if (!canWriteClinicalRecords(session.profile.role)) notFound(); const supabase = await createClient(); const { data } = supabase ? await supabase.from("owners").select("full_name, phone, email, notes").eq("id", id).single() : { data: null }; if (!data) notFound(); const action = updateOwner.bind(null, id); return <AdminShell session={session}><Link href={`/admin/owners/${id}`} className="text-sm underline">← Kayıt detayı</Link><section className="mt-5 max-w-3xl rounded-2xl bg-white p-6"><h1 className="text-2xl font-semibold">Hayvan Sahibini Düzenle</h1><div className="mt-7"><OwnerForm action={action} owner={data} submitLabel="Değişiklikleri Kaydet" /></div></section></AdminShell>; }
