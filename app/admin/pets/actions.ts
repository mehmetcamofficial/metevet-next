"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { canPermanentlyDelete, canWriteClinicalRecords } from "@/src/lib/admin/permissions";
import { isPetSpecies, normalizeMicrochip } from "@/src/lib/admin/records";
import { createClient } from "@/src/lib/supabase/server";
import type { PetSex } from "@/src/types/database";

export type PetFormState = { message: string | null; errors?: Record<string, string> };
const failed: PetFormState = { message: "İşlem tamamlanamadı. Lütfen tekrar deneyin." };
const denied: PetFormState = { message: "Bu işlem için yetkiniz bulunmuyor." };
const sexes = ["female", "male", "unknown"];

function petValues(formData: FormData) {
  const sex = String(formData.get("sex") ?? "unknown");
  return { owner_id: String(formData.get("ownerId") ?? ""), name: String(formData.get("name") ?? "").trim(), species: String(formData.get("species") ?? ""), breed: String(formData.get("breed") ?? "").trim() || null, sex: (sexes.includes(sex) ? sex : "unknown") as PetSex, birth_date: String(formData.get("birthDate") ?? "") || null, microchip_number: normalizeMicrochip(String(formData.get("microchipNumber") ?? "")), notes: String(formData.get("notes") ?? "").trim() || null };
}

function validatePet(values: ReturnType<typeof petValues>) {
  const errors: Record<string, string> = {};
  if (!values.owner_id) errors.ownerId = "Hayvan sahibi seçimi zorunludur.";
  if (!values.name) errors.name = "Hayvan adı zorunludur.";
  if (!isPetSpecies(values.species)) errors.species = "Geçerli bir tür seçin.";
  if (values.birth_date && values.birth_date > new Date().toISOString().slice(0, 10)) errors.birthDate = "Doğum tarihi gelecekte olamaz.";
  return errors;
}

async function duplicateChip(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>, chip: string | null, excludedId?: string) {
  if (!chip) return false;
  let query = supabase.from("pets").select("id").eq("microchip_number", chip);
  if (excludedId) query = query.neq("id", excludedId);
  const { data } = await query.limit(1).maybeSingle(); return Boolean(data);
}

export async function createPet(_state: PetFormState, formData: FormData): Promise<PetFormState> {
  const session = await requireStaff(); if (!canWriteClinicalRecords(session.profile.role)) return denied;
  const values = petValues(formData); const errors = validatePet(values);
  if (Object.keys(errors).length) return { message: "Lütfen işaretli alanları düzeltin.", errors };
  const supabase = await createClient(); if (!supabase) return failed;
  if (await duplicateChip(supabase, values.microchip_number)) return { message: "Bu mikroçip numarası başka bir hayvana ait.", errors: { microchipNumber: "Tekrarlanan mikroçip numarası." } };
  const { data, error } = await supabase.from("pets").insert(values).select("id").single(); if (error || !data) return failed;
  await supabase.from("audit_logs").insert({ actor_user_id: session.id, action: "pet_created", entity_type: "pet", entity_id: data.id, metadata: { fields: ["owner_id", "name", "species", ...(values.microchip_number ? ["microchip_number"] : [])] } });
  revalidatePath("/admin/pets"); revalidatePath(`/admin/owners/${values.owner_id}`); redirect(`/admin/pets/${data.id}`);
}

export async function updatePet(id: string, _state: PetFormState, formData: FormData): Promise<PetFormState> {
  const session = await requireStaff(); if (!canWriteClinicalRecords(session.profile.role)) return denied;
  const values = petValues(formData); const errors = validatePet(values);
  if (Object.keys(errors).length) return { message: "Lütfen işaretli alanları düzeltin.", errors };
  const supabase = await createClient(); if (!supabase) return failed;
  if (await duplicateChip(supabase, values.microchip_number, id)) return { message: "Bu mikroçip numarası başka bir hayvana ait.", errors: { microchipNumber: "Tekrarlanan mikroçip numarası." } };
  const { data: current } = await supabase.from("pets").select("owner_id, name, species, breed, sex, birth_date, microchip_number, notes").eq("id", id).single(); if (!current) return failed;
  const { error } = await supabase.from("pets").update(values).eq("id", id); if (error) return failed;
  const changed = Object.entries(values).filter(([key, value]) => current[key as keyof typeof current] !== value).map(([key]) => key);
  await supabase.from("audit_logs").insert({ actor_user_id: session.id, action: "pet_updated", entity_type: "pet", entity_id: id, metadata: { fields: changed.filter((field) => field !== "notes"), notes_changed: changed.includes("notes") } });
  revalidatePath("/admin/pets"); revalidatePath(`/admin/pets/${id}`); revalidatePath(`/admin/owners/${values.owner_id}`); redirect(`/admin/pets/${id}`);
}

async function petLifecycle(id: string, action: "archive" | "restore" | "delete") {
  const session = await requireStaff(); if (!canPermanentlyDelete(session.profile.role)) throw new Error("Bu işlem için yetkiniz bulunmuyor.");
  const supabase = await createClient(); if (!supabase) throw new Error("İşlem tamamlanamadı.");
  if (action === "delete") { const { error } = await supabase.from("pets").delete().eq("id", id); if (error) throw new Error("Kayıt silinemedi. Bağlı kayıtları kontrol edin."); }
  else { const { error } = await supabase.from("pets").update({ archived_at: action === "archive" ? new Date().toISOString() : null }).eq("id", id); if (error) throw new Error("İşlem tamamlanamadı."); }
  await supabase.from("audit_logs").insert({ actor_user_id: session.id, action: `pet_${action}d`, entity_type: "pet", entity_id: id, metadata: action === "delete" ? { permanent: true } : { fields: ["archived_at"] } });
  revalidatePath("/admin/pets"); revalidatePath(`/admin/pets/${id}`); if (action === "delete") redirect("/admin/pets");
}
export async function archivePet(id: string) { await petLifecycle(id, "archive"); }
export async function restorePet(id: string) { await petLifecycle(id, "restore"); }
export async function deletePet(id: string) { await petLifecycle(id, "delete"); }
