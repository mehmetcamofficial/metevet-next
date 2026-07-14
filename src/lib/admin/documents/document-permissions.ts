import type { DocumentType, UserRole } from "@/src/types/database";

/**
 * Business rule: staff may generate appointment_summary only — no clinical
 * document types.  Admin and veterinarian may generate any type.
 *
 * RLS mirrors this: generated_documents SELECT policy allows
 *   is_clinical_staff() OR (is_staff() AND document_type = 'appointment_summary')
 *
 * Appointment summaries contain scheduling data (date, service, status, source),
 * never clinical findings.  Their disclaimer explicitly states the document is
 * not an examination, diagnosis, or treatment record.
 */

const STAFF_ALLOWED_TYPE: DocumentType = "appointment_summary";

const CLINICAL_ROLES: ReadonlySet<UserRole> = new Set(["admin", "veterinarian"]);

/** Whether the role may generate the given document type. */
export function canGenerateDocument(role: UserRole, type: DocumentType): boolean {
  if (CLINICAL_ROLES.has(role)) return true;
  return role === "staff" && type === STAFF_ALLOWED_TYPE;
}

/** Document types the role may generate — filters the full list by permission. */
export function visibleDocumentTypes(role: UserRole, types: readonly DocumentType[]): DocumentType[] {
  return types.filter((type) => canGenerateDocument(role, type));
}

/** Whether staff can access (read) a generated document of this type — mirrors RLS. */
export function canStaffAccessDocument(type: DocumentType): boolean {
  return type === STAFF_ALLOWED_TYPE;
}

/** Whether the role may include internal notes in a document. */
export const canIncludeInternalNotes = (role: UserRole): boolean => role === "admin";

/** Whether the role may permanently delete archived documents. */
export const canDeleteDocuments = (role: UserRole): boolean => role === "admin";

/** Whether the role may archive or restore a document they generated. */
export const canArchiveDocument = (role: UserRole, generatedBy: string, userId: string): boolean =>
  role === "admin" || (role === "veterinarian" && generatedBy === userId);
