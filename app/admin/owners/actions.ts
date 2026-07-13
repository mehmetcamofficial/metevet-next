"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { canPermanentlyDelete, canWriteClinicalRecords } from "@/src/lib/admin/permissions";
import { normalizePhone } from "@/src/lib/admin/records";
import { createClient } from "@/src/lib/supabase/server";

export type OwnerFormState = { message: string | null; errors?: Record<string, string> };
const denied: OwnerFormState = { message: "Bu işlem için yetkiniz bulunmuyor." };
const failed: OwnerFormState = { message: "İşlem tamamlanamadı. Lütfen tekrar deneyin." };

function ownerValues(formData: FormData) {
  return {
    full_name: String(formData.get("fullName") ?? "").trim(),
    phone: normalizePhone(String(formData.get("phone") ?? "")),
    email: String(formData.get("email") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

function validateOwner(values: ReturnType<typeof ownerValues>) {
  const errors: Record<string, string> = {};
  if (!values.full_name) errors.fullName = "Ad soyad zorunludur.";
  if (!values.phone) errors.phone = "Geçerli bir Türkiye telefon numarası girin.";
  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) errors.email = "Geçerli bir e-posta adresi girin.";
  return errors;
}

export async function createOwner(_state: OwnerFormState, formData: FormData): Promise<OwnerFormState> {
  const session = await requireStaff();
  if (!canWriteClinicalRecords(session.profile.role)) return denied;
  const values = ownerValues(formData);
  const errors = validateOwner(values);
  if (Object.keys(errors).length) return { message: "Lütfen işaretli alanları düzeltin.", errors };
  const supabase = await createClient();
  if (!supabase || !values.phone) return failed;
  const { data: duplicate } = await supabase.from("owners").select("id").eq("phone", values.phone).maybeSingle();
  if (duplicate) return { message: "Bu telefon numarasıyla kayıtlı başka bir hayvan sahibi var.", errors: { phone: "Tekrarlanan telefon numarası." } };
  const { data, error } = await supabase.from("owners").insert({ ...values, phone: values.phone }).select("id").single();
  if (error || !data) return failed;
  await supabase.from("audit_logs").insert({ actor_user_id: session.id, action: "owner_created", entity_type: "owner", entity_id: data.id, metadata: { fields: ["full_name", "phone", ...(values.email ? ["email"] : [])] } });
  revalidatePath("/admin/owners");
  redirect(`/admin/owners/${data.id}`);
}

export async function updateOwner(id: string, _state: OwnerFormState, formData: FormData): Promise<OwnerFormState> {
  const session = await requireStaff();
  if (!canWriteClinicalRecords(session.profile.role)) return denied;
  const values = ownerValues(formData);
  const errors = validateOwner(values);
  if (Object.keys(errors).length) return { message: "Lütfen işaretli alanları düzeltin.", errors };
  const supabase = await createClient();
  if (!supabase || !values.phone) return failed;
  const { data: duplicate } = await supabase.from("owners").select("id").eq("phone", values.phone).neq("id", id).limit(1).maybeSingle();
  if (duplicate) return { message: "Bu telefon numarasıyla kayıtlı başka bir hayvan sahibi var.", errors: { phone: "Tekrarlanan telefon numarası." } };
  const { data: current } = await supabase.from("owners").select("full_name, phone, email, notes").eq("id", id).single();
  if (!current) return failed;
  const { error } = await supabase.from("owners").update({ ...values, phone: values.phone }).eq("id", id);
  if (error) return failed;
  const changed = Object.entries(values).filter(([key, value]) => current[key as keyof typeof current] !== value).map(([key]) => key);
  await supabase.from("audit_logs").insert({ actor_user_id: session.id, action: "owner_updated", entity_type: "owner", entity_id: id, metadata: { fields: changed.filter((field) => field !== "notes"), notes_changed: changed.includes("notes") } });
  revalidatePath("/admin/owners"); revalidatePath(`/admin/owners/${id}`);
  redirect(`/admin/owners/${id}`);
}

async function ownerLifecycle(id: string, action: "archive" | "restore" | "delete") {
  const session = await requireStaff();
  if (!canPermanentlyDelete(session.profile.role)) throw new Error("Bu işlem için yetkiniz bulunmuyor.");
  const supabase = await createClient(); if (!supabase) throw new Error("İşlem tamamlanamadı.");
  if (action === "delete") {
    const { error } = await supabase.from("owners").delete().eq("id", id); if (error) throw new Error("Kayıt silinemedi. Bağlı kayıtları kontrol edin.");
  } else {
    const { error } = await supabase.from("owners").update({ archived_at: action === "archive" ? new Date().toISOString() : null }).eq("id", id); if (error) throw new Error("İşlem tamamlanamadı.");
  }
  await supabase.from("audit_logs").insert({ actor_user_id: session.id, action: `owner_${action}d`, entity_type: "owner", entity_id: id, metadata: action === "delete" ? { permanent: true } : { fields: ["archived_at"] } });
  revalidatePath("/admin/owners"); revalidatePath(`/admin/owners/${id}`);
  if (action === "delete") redirect("/admin/owners");
}

export async function archiveOwner(id: string) { await ownerLifecycle(id, "archive"); }
export async function restoreOwner(id: string) { await ownerLifecycle(id, "restore"); }
export async function deleteOwner(id: string) { await ownerLifecycle(id, "delete"); }
