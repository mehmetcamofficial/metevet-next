import type { DocumentType, UserRole } from "@/src/types/database";

export type DocumentSourceKind = "examination" | "appointment" | "pet";

const examinationTypes = new Set<DocumentType>([
  "examination_summary",
  "follow_up_instructions",
  "custom_clinical_note",
]);

const finalExaminationTypes = new Set<DocumentType>([
  "examination_summary",
  "follow_up_instructions",
]);

export function documentSourceKind(type: DocumentType): DocumentSourceKind {
  if (examinationTypes.has(type)) return "examination";
  if (type === "appointment_summary") return "appointment";
  return "pet";
}

export function changeDocumentType(currentType: string, nextType: string, currentSource: string) {
  return { type: nextType, source: currentType === nextType ? currentSource : "" };
}

export function requiresFinalExamination(type: DocumentType) {
  return finalExaminationTypes.has(type);
}

export function isAllowedExaminationSource(
  type: DocumentType,
  status: "draft" | "finalized" | "archived",
) {
  if (documentSourceKind(type) !== "examination") return false;
  return requiresFinalExamination(type) ? status === "finalized" : status !== "archived";
}

export function isAllowedPetSource(archivedAt: string | null, ownerArchivedAt: string | null) {
  return archivedAt === null && ownerArchivedAt === null;
}

export function sourceEmptyState(type: DocumentType) {
  if (requiresFinalExamination(type)) return "Belge oluşturulabilecek final muayene kaydı bulunmuyor.";
  if (documentSourceKind(type) === "examination") return "Belge oluşturulabilecek muayene kaydı bulunmuyor.";
  if (documentSourceKind(type) === "appointment") return "Belge oluşturulabilecek randevu kaydı bulunmuyor.";
  return "Aktif hayvan kaydı bulunmuyor.";
}

export function sourceCreateLink(type: DocumentType, role: UserRole) {
  if (role === "staff") return null;
  if (documentSourceKind(type) === "examination") return "/admin/examinations/new";
  if (documentSourceKind(type) === "appointment") return "/admin/appointments/new";
  return "/admin/pets/new";
}
