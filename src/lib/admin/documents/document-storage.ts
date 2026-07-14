import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/src/types/database";

export const CLINICAL_BUCKET = "clinical-documents";
export const MAX_CLINICAL_PDF_BYTES = 10 * 1024 * 1024;

export function clinicalDocumentPath(
  userId: string,
  reference: string,
  fileName: string,
) {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Geçersiz kullanıcı yolu.");
  if (!/^MV-[0-9]{8}-[A-F0-9]{8}$/.test(reference)) throw new Error("Geçersiz belge yolu.");
  if (!/^[a-zA-Z0-9._-]+\.pdf$/.test(fileName)) throw new Error("Geçersiz dosya adı.");
  return `${userId}/${reference}/${fileName}`;
}

export async function uploadClinicalPdf(
  s: SupabaseClient<Database>,
  path: string,
  pdf: Buffer,
) {
  if (pdf.byteLength === 0 || pdf.byteLength > MAX_CLINICAL_PDF_BYTES) {
    throw new Error("PDF boyutu geçersiz.");
  }
  if (pdf.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Dosya geçerli bir PDF değil.");
  }
  const { error } = await s.storage.from(CLINICAL_BUCKET).upload(path, pdf, {
    contentType: "application/pdf",
    upsert: false,
    cacheControl: "private, max-age=0",
  });
  if (error) throw new Error("Belge güvenli depolamaya yüklenemedi.");
}

export async function removeClinicalPdf(
  s: SupabaseClient<Database>,
  path: string,
) {
  const { error } = await s.storage.from(CLINICAL_BUCKET).remove([path]);
  if (error) throw new Error("Belge güvenli depolamadan silinemedi.");
}

export async function downloadClinicalPdf(
  s: SupabaseClient<Database>,
  path: string,
) {
  const { data, error } = await s.storage.from(CLINICAL_BUCKET).download(path);
  if (error || !data) throw new Error("Belge kurtarma kopyası alınamadı.");
  const buffer = Buffer.from(await data.arrayBuffer());
  if (buffer.byteLength > MAX_CLINICAL_PDF_BYTES) throw new Error("Belge kurtarma kopyası çok büyük.");
  return buffer;
}
