import Link from "next/link";
import { notFound } from "next/navigation";
import { createOwner } from "../actions";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { OwnerForm } from "@/src/components/admin/owners/owner-form";
import { canWriteClinicalRecords } from "@/src/lib/admin/permissions";
import { requireStaff } from "@/src/lib/auth/require-staff";

export default async function NewOwnerPage() { const session = await requireStaff(); if (!canWriteClinicalRecords(session.profile.role)) notFound(); return <AdminShell session={session}><Link href="/admin/owners" className="text-sm underline">← Hayvan sahipleri</Link><section className="mt-5 max-w-3xl rounded-2xl bg-white p-6"><h1 className="text-2xl font-semibold">Yeni Hayvan Sahibi</h1><p className="mt-2 text-sm text-[#526a64]">Telefon numarası standart biçimde kaydedilir; mevcut kayıt eşleşmesi ayrıca kontrol edilir.</p><div className="mt-7"><OwnerForm action={createOwner} submitLabel="Kaydı Oluştur" /></div></section></AdminShell>; }
