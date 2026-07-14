import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, DocumentType } from "@/src/types/database";
import { documentTypeLabels } from "./document-types";

export type DocumentField = { label: string; value: string };
export type DocumentEntry = { title?: string; fields: DocumentField[] };
export type DocumentSection = {
  title: string;
  content?: string;
  rows?: DocumentField[];
  entries?: DocumentEntry[];
};
export type ClinicalDocumentData = {
  type: DocumentType;
  title: string;
  subtitle: string;
  footerLabel: string;
  reference: string;
  generatedAt: string;
  ownerId: string | null;
  petId: string | null;
  appointmentId: string | null;
  examinationId: string | null;
  ownerName: string;
  petName: string;
  patient: {
    name: string;
    species: string | null;
    breed: string | null;
    sex: string;
    birthDate: string;
    age: string;
    microchip: string | null;
  };
  clinic: {
    name: string;
    authorizedVeterinarian: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    registration: string | null;
  };
  clinician: string | null;
  vitals: DocumentField[] | null;
  clinicalSummary: DocumentField[] | null;
  sections: DocumentSection[];
  disclaimer: string;
};

const empty = "Belirtilmemiş";
const present = (value: unknown): value is string | number =>
  value !== null && value !== undefined && String(value).trim() !== "";
const show = (value: unknown) => (present(value) ? String(value) : empty);
const dt = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Istanbul",
      }).format(new Date(value))
    : empty;
const optionalDt = (value: string | null) => (value ? dt(value) : null);
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "medium",
        timeZone: "Europe/Istanbul",
      }).format(new Date(`${value}T12:00:00+03:00`))
    : empty;

const statusLabels: Record<string, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
  no_show: "Gelmedi",
  scheduled: "Planlandı",
  expired: "Süresi Geçti",
  draft: "Taslak",
  finalized: "Final",
};
const sexLabels: Record<string, string> = {
  female: "Dişi",
  male: "Erkek",
  unknown: empty,
};
const visitLabels: Record<string, string> = {
  general_exam: "Genel Muayene",
  follow_up: "Kontrol",
  vaccination: "Aşılama",
  emergency: "Acil",
  surgery_control: "Ameliyat Kontrolü",
  dental: "Diş",
  other: "Diğer",
};
const sourceLabels: Record<string, string> = {
  website: "Web Sitesi",
  plandok: "PlanDok",
  whatsapp: "WhatsApp",
  phone: "Telefon",
  walk_in: "Doğrudan Başvuru",
  admin: "Klinik İçi",
};
const parasiteLabels: Record<string, string> = {
  internal: "İç Parazit",
  external: "Dış Parazit",
  combined: "İç ve Dış Parazit",
};

export const documentEnumLabel = (
  kind: "status" | "sex" | "visit" | "source" | "parasite",
  value: string,
) =>
  ({
    status: statusLabels,
    sex: sexLabels,
    visit: visitLabels,
    source: sourceLabels,
    parasite: parasiteLabels,
  })[kind][value] ?? value.replaceAll("_", " ");

export const documentSubtitles: Record<DocumentType, string> = {
  examination_summary: "Muayene ve klinik değerlendirme kaydı",
  vaccination_card: "Aşı uygulamaları ve takip planı",
  preventive_care_history: "Aşı ve parazit uygulama geçmişi",
  appointment_summary: "Randevu ve hizmet bilgileri",
  pet_health_summary: "Temel sağlık ve klinik geçmiş özeti",
  parasite_summary: "Parazit uygulamaları ve takip planı",
  follow_up_instructions: "Kontrol planı ve veteriner hekim önerileri",
  custom_clinical_note: "Klinik değerlendirme ve hekim notları",
};

export const documentDisclaimers: Record<DocumentType, string> = {
  examination_summary:
    "Bu belge, belirtilen tarihte gerçekleştirilen veteriner hekim muayenesine ait kayıt özetidir. Acil durumlarda veya hayvanın klinik durumunda değişiklik olduğunda veteriner hekiminizle iletişime geçiniz.",
  vaccination_card:
    "Bu belge, kayıtlı aşı uygulamalarını ve planlanan takip tarihlerini gösterir. Aşı takvimi, hayvanın sağlık durumuna göre veteriner hekim tarafından değiştirilebilir.",
  preventive_care_history:
    "Bu belge, kayıtlı aşı ve parazit uygulamalarının geçmişini gösterir. Sonraki uygulama tarihleri takip amaçlıdır ve veteriner hekim değerlendirmesinin yerini almaz.",
  appointment_summary:
    "Bu belge randevu ve hizmet bilgilerini özetler; muayene, tanı veya tedavi belgesi değildir.",
  pet_health_summary:
    "Bu belge, sistemde kayıtlı temel sağlık geçmişinin özetidir ve güncel veteriner hekim muayenesinin yerini almaz.",
  parasite_summary:
    "Bu belge, kayıtlı parazit uygulamalarını ve takip tarihlerini gösterir. Uygulama planı veteriner hekim değerlendirmesine göre değiştirilebilir.",
  follow_up_instructions:
    "Bu belge, veteriner hekimin kayıtlı kontrol ve bakım önerilerini içerir. Klinik durumda değişiklik olması halinde veteriner hekiminizle iletişime geçiniz.",
  custom_clinical_note:
    "Bu belge yetkili klinik kullanım için oluşturulmuş klinik not çıktısıdır. İçeriği yalnızca ilgili sağlık kaydı kapsamında değerlendirilmelidir.",
};

export const documentFooterLabels: Record<DocumentType, string> = {
  examination_summary: "Klinik belge",
  custom_clinical_note: "Gizli klinik belge",
  vaccination_card: "Veteriner sağlık belgesi",
  preventive_care_history: "Veteriner sağlık kaydı",
  appointment_summary: "Randevu belgesi",
  pet_health_summary: "Veteriner sağlık özeti",
  parasite_summary: "Veteriner sağlık belgesi",
  follow_up_instructions: "Klinik takip belgesi",
};

export function calculatePatientAge(birth: string | null, now = new Date()) {
  if (!birth) return empty;
  const born = new Date(`${birth}T12:00:00+03:00`);
  const months = Math.max(
    0,
    (now.getFullYear() - born.getFullYear()) * 12 +
      now.getMonth() -
      born.getMonth(),
  );
  return months < 12
    ? `${months} aylık`
    : `${Math.floor(months / 12)} yaş ${months % 12 ? `${months % 12} ay` : ""}`.trim();
}

const optionalField = (label: string, value: unknown): DocumentField | null =>
  present(value) ? { label, value: String(value) } : null;
const fields = (...items: Array<DocumentField | null>) =>
  items.filter((item): item is DocumentField => item !== null);

export async function fetchDocumentData(
  s: SupabaseClient<Database>,
  type: DocumentType,
  sourceId: string,
  reference: string,
  includeInternal = false,
): Promise<ClinicalDocumentData> {
  let ownerId: string | null = null;
  let petId: string | null = null;
  let appointmentId: string | null = null;
  let examinationId: string | null = null;
  let clinician: string | null = null;
  let vitals: ClinicalDocumentData["vitals"] = null;
  let clinicalSummary: ClinicalDocumentData["clinicalSummary"] = null;
  const sections: DocumentSection[] = [];

  // appointment_summary: intentionally limited to scheduling data only.
  // Never queries examinations, vaccination_records, parasite_records, or
  // owner private contact (phone, email, address).  Staff may generate this
  // type — clinical findings require veterinarian authority.
  if (type === "appointment_summary") {
    const { data: appointment } = await s
      .from("appointments")
      .select(
        "id,owner_id,pet_id,assigned_user_id,status,starts_at,ends_at,service_key,source,reason",
      )
      .eq("id", sourceId)
      .single();
    if (!appointment) throw new Error("Randevu kaydı bulunamadı.");
    ownerId = appointment.owner_id;
    petId = appointment.pet_id;
    appointmentId = appointment.id;
    sections.push({
      title: "Randevu Bilgileri",
      rows: fields(
        { label: "Tarih / Saat", value: dt(appointment.starts_at) },
        { label: "Hizmet", value: show(appointment.service_key) },
        { label: "Durum", value: documentEnumLabel("status", appointment.status) },
        { label: "Kaynak", value: documentEnumLabel("source", appointment.source) },
        optionalField("Başvuru Nedeni", appointment.reason),
      ),
    });
    if (appointment.assigned_user_id) {
      const { data: vet } = await s
        .from("profiles")
        .select("full_name,role,status")
        .eq("id", appointment.assigned_user_id)
        .maybeSingle();
      if (vet?.role === "veterinarian" && vet.status === "active") {
        clinician = vet.full_name;
      }
    }
  } else if (
    type === "examination_summary" ||
    type === "follow_up_instructions" ||
    type === "custom_clinical_note"
  ) {
    const { data: examination } = await s
      .from("examinations")
      .select("*")
      .eq("id", sourceId)
      .single();
    if (!examination) throw new Error("Muayene kaydı bulunamadı.");
    if (
      (type !== "custom_clinical_note" && examination.status !== "finalized") ||
      (type === "custom_clinical_note" && examination.status === "archived")
    ) {
      throw new Error("Muayene kaydı bu belge türü için uygun değil.");
    }
    const { data: vet } = await s
      .from("profiles")
      .select("full_name,role,status")
      .eq("id", examination.veterinarian_id)
      .maybeSingle();
    if (!vet || vet.role !== "veterinarian" || vet.status !== "active") {
      throw new Error("Geçerli veteriner hekim atfı bulunamadı.");
    }
    clinician = vet.full_name;
    ownerId = examination.owner_id;
    petId = examination.pet_id;
    appointmentId = examination.appointment_id;
    examinationId = examination.id;

    if (type === "follow_up_instructions") {
      sections.push({
        title: "Kontrol ve Öneriler",
        rows: fields(
          optionalField("Öneriler", examination.recommendations),
          optionalField("Kontrol Tarihi", optionalDt(examination.follow_up_at)),
        ),
      });
    } else {
      sections.push({
        title: "Ziyaret Bilgileri",
        rows: fields(
          {
            label: "Ziyaret Türü",
            value: documentEnumLabel("visit", examination.visit_type),
          },
          { label: "Muayene Tarihi", value: dt(examination.created_at) },
          optionalField("Kontrol Tarihi", optionalDt(examination.follow_up_at)),
        ),
      });
      vitals = fields(
        examination.weight_kg !== null
          ? { label: "Ağırlık", value: `${examination.weight_kg} kg` }
          : null,
        examination.temperature_c !== null
          ? { label: "Sıcaklık", value: `${examination.temperature_c} °C` }
          : null,
        examination.heart_rate !== null
          ? { label: "Kalp Hızı", value: `${examination.heart_rate} atım/dk` }
          : null,
        examination.respiratory_rate !== null
          ? { label: "Solunum Hızı", value: `${examination.respiratory_rate} solunum/dk` }
          : null,
      );
      if (!vitals.length) vitals = null;
      clinicalSummary = fields(
        { label: "Ziyaret Türü", value: documentEnumLabel("visit", examination.visit_type) },
        optionalField("Tanı", examination.diagnosis),
        optionalField("Kontrol Tarihi", optionalDt(examination.follow_up_at)),
        clinician ? { label: "Veteriner Hekim", value: clinician } : null,
      );
      if (!clinicalSummary.length) clinicalSummary = null;
      const clinicalContent: Array<[string, string | null]> = [
        ["Başlıca Şikâyet", examination.chief_complaint],
        ["Öykü", examination.history],
        ["Muayene Bulguları", examination.examination_findings],
        ["Değerlendirme", examination.assessment],
        ["Tanı", examination.diagnosis],
        ["Uygulanan İşlemler", examination.procedures],
        ["Tedavi Planı", examination.treatment_plan],
        ["İlaç Notları", examination.medications_notes],
        ["Öneriler", examination.recommendations],
      ];
      for (const [title, content] of clinicalContent) {
        if (present(content)) sections.push({ title, content });
      }
      if (includeInternal && present(examination.internal_notes)) {
        sections.push({ title: "Dahili Notlar", content: examination.internal_notes });
      }
    }
  } else {
    petId = sourceId;
    const { data: pet } = await s
      .from("pets")
      .select("id,owner_id")
      .eq("id", sourceId)
      .is("archived_at", null)
      .single();
    if (!pet) throw new Error("Aktif hayvan kaydı bulunamadı.");
    ownerId = pet.owner_id;
    const { data: owner } = await s
      .from("owners")
      .select("id")
      .eq("id", ownerId)
      .is("archived_at", null)
      .maybeSingle();
    if (!owner) throw new Error("Aktif hayvan sahibi bulunamadı.");

    if (
      type === "vaccination_card" ||
      type === "preventive_care_history" ||
      type === "pet_health_summary"
    ) {
      const { data: vaccines } = await s
        .from("vaccination_records")
        .select(
          "vaccine_name,manufacturer,batch_number,serial_number,dose_number,administration_date,next_due_date,status,veterinarian_id",
        )
        .eq("pet_id", sourceId)
        .is("archived_at", null)
        .order("administration_date");
      const vetIds = [
        ...new Set((vaccines ?? []).map((item) => item.veterinarian_id).filter(Boolean)),
      ] as string[];
      const { data: vets } = vetIds.length
        ? await s
            .from("profiles")
            .select("id,full_name,role,status")
            .in("id", vetIds)
            .eq("role", "veterinarian")
            .eq("status", "active")
        : { data: [] };
      const vetNames = new Map((vets ?? []).map((item) => [item.id, item.full_name]));
      const entries = (vaccines ?? []).map((item) => ({
        title: item.vaccine_name,
        fields: fields(
          { label: "Uygulama Tarihi", value: dt(item.administration_date) },
          optionalField("Üretici", item.manufacturer),
          optionalField("Parti No", item.batch_number),
          optionalField("Seri No", item.serial_number),
          { label: "Doz", value: String(item.dose_number) },
          { label: "Durum", value: documentEnumLabel("status", item.status) },
          optionalField("Veteriner Hekim", vetNames.get(item.veterinarian_id ?? "")),
          optionalField("Sonraki Uygulama", optionalDt(item.next_due_date)),
        ),
      }));
      if (entries.length) sections.push({ title: "Aşı Geçmişi", entries });
    }

    if (
      type === "parasite_summary" ||
      type === "preventive_care_history" ||
      type === "pet_health_summary"
    ) {
      const { data: treatments } = await s
        .from("parasite_records")
        .select(
          "product_name,treatment_type,administration_date,next_due_date,status,veterinarian_id",
        )
        .eq("pet_id", sourceId)
        .is("archived_at", null)
        .order("administration_date");
      const vetIds = [
        ...new Set((treatments ?? []).map((item) => item.veterinarian_id).filter(Boolean)),
      ] as string[];
      const { data: vets } = vetIds.length
        ? await s
            .from("profiles")
            .select("id,full_name,role,status")
            .in("id", vetIds)
            .eq("role", "veterinarian")
            .eq("status", "active")
        : { data: [] };
      const vetNames = new Map((vets ?? []).map((item) => [item.id, item.full_name]));
      const entries = (treatments ?? []).map((item) => ({
        title: item.product_name,
        fields: fields(
          {
            label: "Uygulama Türü",
            value: documentEnumLabel("parasite", item.treatment_type),
          },
          { label: "Uygulama Tarihi", value: dt(item.administration_date) },
          { label: "Durum", value: documentEnumLabel("status", item.status) },
          optionalField("Veteriner Hekim", vetNames.get(item.veterinarian_id ?? "")),
          optionalField("Sonraki Uygulama", optionalDt(item.next_due_date)),
        ),
      }));
      if (entries.length) sections.push({ title: "Parazit Uygulamaları", entries });
    }
  }

  const [owner, pet, settings] = await Promise.all([
    ownerId
      ? s.from("owners").select("full_name").eq("id", ownerId).single()
      : Promise.resolve({ data: null }),
    petId
      ? s
          .from("pets")
          .select("name,species,breed,sex,birth_date,microchip_number")
          .eq("id", petId)
          .single()
      : Promise.resolve({ data: null }),
    s
      .from("clinic_settings")
      .select(
        "clinic_name_tr,authorized_veterinarian,phone,website_url,address_tr,registration_text",
      )
      .eq("id", true)
      .maybeSingle(),
  ]);
  if (ownerId && !owner.data) throw new Error("Hayvan sahibi kaydı bulunamadı.");
  const microchipValue = pet.data?.microchip_number;
  const patient = {
    name: present(pet.data?.name) ? String(pet.data?.name).trim() : empty,
    species: present(pet.data?.species) ? String(pet.data?.species).trim() : null,
    breed: present(pet.data?.breed) ? String(pet.data?.breed).trim() : null,
    sex: documentEnumLabel("sex", pet.data?.sex ?? "unknown"),
    birthDate: date(pet.data?.birth_date ?? null),
    age: calculatePatientAge(pet.data?.birth_date ?? null),
    microchip: present(microchipValue) ? String(microchipValue).trim() : null,
  };
  const ownerNameValue = owner.data?.full_name;
  const ownerName = present(ownerNameValue) ? String(ownerNameValue).trim() : empty;
  return {
    type,
    title: documentTypeLabels[type],
    subtitle: documentSubtitles[type],
    footerLabel: documentFooterLabels[type],
    reference,
    generatedAt: dt(new Date().toISOString()),
    ownerId,
    petId,
    appointmentId,
    examinationId,
    ownerName,
    petName: patient.name,
    patient,
    clinic: {
      name: settings.data?.clinic_name_tr ?? "MeteVet Veteriner Kliniği",
      authorizedVeterinarian: settings.data?.authorized_veterinarian ?? null,
      phone: settings.data?.phone ?? null,
      website: settings.data?.website_url ?? null,
      address: settings.data?.address_tr ?? null,
      registration: settings.data?.registration_text ?? null,
    },
    clinician,
    vitals,
    clinicalSummary,
    sections: sections.filter(
      (section) =>
        present(section.content) ||
        Boolean(section.rows?.some((row) => row.value && row.value.trim())) ||
        Boolean(section.entries?.some((entry) => entry.fields.length)),
    ),
    disclaimer: documentDisclaimers[type],
  };
}
