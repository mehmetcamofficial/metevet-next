import Link from "next/link";
import type { PetMedicalRecord } from "@/src/lib/admin/medical-record/medical-record-readers";

function formatBirthDate(birthDate: string | null): string {
  if (!birthDate) return "Belirtilmemiş";
  const date = new Date(birthDate);
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(date);
}

function formatSex(sex: string): string {
  switch (sex) {
    case "male": return "Erkek";
    case "female": return "Dişi";
    default: return "Belirtilmemiş";
  }
}

export function MedicalRecordHeader({
  pet,
  showPhone,
}: {
  pet: PetMedicalRecord;
  showPhone: boolean;
  role: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{pet.name}</h1>
          <p className="mt-1 text-sm text-[#526a64]">Tıbbi Dosya</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/appointments/new?pet_id=${pet.id}&owner_id=${pet.owner_id}`}
            className="rounded-lg bg-[#0d2922] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            Yeni Randevu
          </Link>
          <Link
            href={`/admin/examinations/new?pet_id=${pet.id}&owner_id=${pet.owner_id}`}
            className="rounded-lg border border-[#0d2922] px-4 py-2 text-sm font-semibold text-[#0d2922] hover:bg-[#f4f0e8]"
          >
            Muayeneyi Başlat
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4 rounded-xl bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-semibold uppercase text-[#526a64]">Tür</dt>
          <dd className="mt-1 text-sm font-medium">{pet.species}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-[#526a64]">Irk</dt>
          <dd className="mt-1 text-sm font-medium">{pet.breed ?? "Belirtilmemiş"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-[#526a64]">Cinsiyet</dt>
          <dd className="mt-1 text-sm font-medium">{formatSex(pet.sex)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-[#526a64]">Doğum Tarihi</dt>
          <dd className="mt-1 text-sm font-medium">{formatBirthDate(pet.birth_date)}</dd>
        </div>
        {pet.microchip_number && (
          <div>
            <dt className="text-xs font-semibold uppercase text-[#526a64]">Mikroçip</dt>
            <dd className="mt-1 text-sm font-medium">{pet.microchip_number}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-semibold uppercase text-[#526a64]">Sahip</dt>
          <dd className="mt-1 text-sm font-medium">
            <Link href={`/admin/owners/${pet.owner_id}`} className="underline hover:no-underline">
              {pet.owner_name}
            </Link>
          </dd>
        </div>
        {showPhone && pet.owner_phone && (
          <div>
            <dt className="text-xs font-semibold uppercase text-[#526a64]">Telefon</dt>
            <dd className="mt-1 text-sm font-medium">
              <a href={`tel:${pet.owner_phone}`} className="underline hover:no-underline">
                {pet.owner_phone}
              </a>
            </dd>
          </div>
        )}
        {pet.archived_at && (
          <div>
            <dt className="text-xs font-semibold uppercase text-amber-700">Durum</dt>
            <dd className="mt-1 text-sm font-medium text-amber-700">Arşivlenmiş</dd>
          </div>
        )}
      </div>
    </div>
  );
}
