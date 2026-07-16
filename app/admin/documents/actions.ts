"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fetchDocumentData } from "@/src/lib/admin/documents/document-data";
import { clinicalDocumentFileName } from "@/src/lib/admin/documents/document-file-name";
import { generateClinicalPdf } from "@/src/lib/admin/documents/document-generator";
import { createDocumentNumber } from "@/src/lib/admin/documents/document-number";
import {
  canArchiveDocument,
  canDeleteDocuments,
  canGenerateDocument,
  canIncludeInternalNotes,
} from "@/src/lib/admin/documents/document-permissions";
import { documentSourceKind } from "@/src/lib/admin/documents/document-source-policy";
import {
  clinicalDocumentPath,
  downloadClinicalPdf,
  removeClinicalPdf,
  uploadClinicalPdf,
} from "@/src/lib/admin/documents/document-storage";
import { isDocumentType, safeLanguage } from "@/src/lib/admin/documents/document-validation";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createServerActionClient } from "@/src/lib/supabase/server-action";

export type DocumentFormState = { message: string | null };

export async function generateDocument(
  _state: DocumentFormState,
  fd: FormData,
): Promise<DocumentFormState> {
  const session = await requireStaff();
  const type = String(fd.get("documentType") ?? "");
  const sourceId = String(fd.get("sourceId") ?? "");
  const language = safeLanguage(String(fd.get("language") ?? "tr"));
  const internal = fd.get("includeInternalNotes") === "on";
  if (!isDocumentType(type) || !sourceId || !canGenerateDocument(session.profile.role, type)) {
    return { message: "Belge türü, kaynak veya yetki geçersiz." };
  }
  if (internal && !canIncludeInternalNotes(session.profile.role)) {
    return { message: "Dahili notları yalnızca yönetici ekleyebilir." };
  }
  const s = await createServerActionClient();
  if (!s) return { message: "Belge üretilemedi." };
  const reference = createDocumentNumber();
  let storagePath: string | null = null;
  try {
    const data = await fetchDocumentData(s, type, sourceId, reference, internal);
    const kind = documentSourceKind(type);
    if (kind === "appointment" && !data.appointmentId)
      return { message: "Kaynak türü eşleşmiyor." };
    if (kind === "examination" && !data.examinationId)
      return { message: "Kaynak türü eşleşmiyor." };
    const fileName = clinicalDocumentFileName(reference, type, data.petName);
    const { buffer, checksum } = await generateClinicalPdf(data);
    if (session.profile.role !== "staff") {
      storagePath = clinicalDocumentPath(session.id, reference, fileName);
      await uploadClinicalPdf(s, storagePath, buffer);
    }
    const { data: doc, error } = await s
      .from("generated_documents")
      .insert({
        document_type: type,
        owner_id: data.ownerId,
        pet_id: data.petId,
        appointment_id: data.appointmentId,
        examination_id: data.examinationId,
        generated_by: session.id,
        title: data.title,
        language,
        status: "generated",
        file_name: fileName,
        storage_path: storagePath,
        checksum,
        metadata: { reference, include_internal_notes: internal },
      })
      .select("id")
      .single();
    if (error || !doc) throw new Error("metadata");
    await s.from("audit_logs").insert({
      actor_user_id: session.id,
      action: "document_generated",
      entity_type: "generated_document",
      entity_id: doc.id,
      metadata: {
        document_type: type,
        owner_id: data.ownerId,
        pet_id: data.petId,
        appointment_id: data.appointmentId,
        examination_id: data.examinationId,
        file_name: fileName,
        language,
        status: "generated",
      },
    });
    revalidatePath("/admin/documents");
    redirect(`/admin/documents/${doc.id}`);
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw error;
    if (storagePath) {
      try { await removeClinicalPdf(s, storagePath); } catch { /* operational audit handles rare cleanup failure */ }
    }
    await s.from("audit_logs").insert({
      actor_user_id: session.id,
      action: "document_generation_failed",
      entity_type: "generated_document",
      metadata: { document_type: type, language, status: "failed" },
    });
    return { message: "Belge güvenli şekilde üretilemedi. Kaynak kaydı ve yetkinizi kontrol edin." };
  }
}

export async function archiveDocument(id: string, restore = false) {
  const session = await requireStaff();
  const s = await createServerActionClient();
  if (!s) throw new Error("İşlem tamamlanamadı.");
  const { data } = await s.from("generated_documents").select("generated_by,status,document_type,file_name").eq("id", id).single();
  if (!data || !canArchiveDocument(session.profile.role, data.generated_by, session.id)) throw new Error("Yetkiniz bulunmuyor.");
  const expectedStatus = restore ? "archived" : "generated";
  if (data.status !== expectedStatus) throw new Error("Geçersiz belge durum geçişi.");
  const status = restore ? "generated" : "archived";
  const { data: updated, error } = await s.from("generated_documents").update({ status, archived_at: restore ? null : new Date().toISOString() }).eq("id", id).eq("status", expectedStatus).select("id").maybeSingle();
  if (error || !updated) throw new Error("Belge güncellenemedi veya başka bir işlem tarafından değiştirildi.");
  await s.from("audit_logs").insert({ actor_user_id: session.id, action: restore ? "document_restored" : "document_archived", entity_type: "generated_document", entity_id: id, metadata: { document_type: data.document_type, file_name: data.file_name, status } });
  revalidatePath("/admin/documents");
  revalidatePath(`/admin/documents/${id}`);
}

export async function deleteDocument(id: string) {
  const session = await requireStaff();
  if (!canDeleteDocuments(session.profile.role)) throw new Error("Yetkiniz bulunmuyor.");
  const s = await createServerActionClient();
  if (!s) throw new Error("İşlem tamamlanamadı.");
  const { data } = await s.from("generated_documents").select("document_type,file_name,storage_path,status").eq("id", id).single();
  if (!data) throw new Error("Belge bulunamadı.");
  if (data.status !== "archived") throw new Error("Belge kalıcı silme öncesinde arşivlenmelidir.");
  const backup = data.storage_path ? await downloadClinicalPdf(s, data.storage_path) : null;
  if (data.storage_path) await removeClinicalPdf(s, data.storage_path);
  const { error } = await s.from("generated_documents").delete().eq("id", id);
  if (error) {
    if (data.storage_path && backup) await uploadClinicalPdf(s, data.storage_path, backup);
    throw new Error("Belge kaydı silinemedi; depolama nesnesi geri yüklendi.");
  }
  await s.from("audit_logs").insert({ actor_user_id: session.id, action: "document_deleted", entity_type: "generated_document", entity_id: id, metadata: { document_type: data.document_type, file_name: data.file_name } });
  revalidatePath("/admin/documents");
  redirect("/admin/documents");
}

export async function regenerateDocument(id: string) {
  const session = await requireStaff();
  const s = await createServerActionClient();
  if (!s) throw new Error("İşlem tamamlanamadı.");
  const { data: old } = await s.from("generated_documents").select("*").eq("id", id).single();
  if (!old || !canGenerateDocument(session.profile.role, old.document_type)) throw new Error("Yetkiniz bulunmuyor.");
  const source = old.examination_id ?? old.appointment_id ?? old.pet_id;
  if (!source) throw new Error("Kaynak bulunamadı.");
  const reference = createDocumentNumber();
  const data = await fetchDocumentData(s, old.document_type, source, reference, false);
  const { buffer, checksum } = await generateClinicalPdf(data);
  const fileName = clinicalDocumentFileName(reference, old.document_type, data.petName);
  let storagePath: string | null = null;
  try {
    if (session.profile.role !== "staff") {
      storagePath = clinicalDocumentPath(session.id, reference, fileName);
      await uploadClinicalPdf(s, storagePath, buffer);
    }
    const { data: next, error } = await s.from("generated_documents").insert({ document_type: old.document_type, owner_id: data.ownerId, pet_id: data.petId, appointment_id: data.appointmentId, examination_id: data.examinationId, generated_by: session.id, title: data.title, language: old.language, status: "generated", file_name: fileName, storage_path: storagePath, checksum, metadata: { reference, regenerated_from: id } }).select("id").single();
    if (error || !next) throw new Error("Belge yeniden üretilemedi.");
    await s.from("audit_logs").insert({ actor_user_id: session.id, action: "document_regenerated", entity_type: "generated_document", entity_id: next.id, metadata: { document_type: old.document_type, file_name: fileName, language: old.language, status: "generated", source_document_id: id } });
    revalidatePath("/admin/documents");
    redirect(`/admin/documents/${next.id}`);
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw error;
    if (storagePath) {
      try { await removeClinicalPdf(s, storagePath); } catch { /* operational audit handles rare cleanup failure */ }
    }
    throw new Error("Belge yeniden üretilemedi.");
  }
}
