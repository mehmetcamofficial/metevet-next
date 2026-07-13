export const PAGE_SIZE = 10;

export const speciesOptions = ["cat", "dog", "bird", "exotic", "other"] as const;
export type PetSpecies = (typeof speciesOptions)[number];

export const speciesLabels: Record<PetSpecies, string> = {
  cat: "Kedi",
  dog: "Köpek",
  bird: "Kuş",
  exotic: "Egzotik",
  other: "Diğer",
};

export function isPetSpecies(value: string): value is PetSpecies {
  return speciesOptions.includes(value as PetSpecies);
}

export function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0090")) digits = digits.slice(4);
  else if (digits.startsWith("90") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return /^[2-5]\d{9}$/.test(digits) ? `+90${digits}` : null;
}

export function normalizeMicrochip(value: string) {
  const normalized = value.replace(/\s/g, "").toUpperCase();
  return normalized || null;
}

export function isDuplicateValue(
  records: Array<{ id: string; value: string | null }>,
  value: string,
  excludedId?: string,
) {
  return records.some(
    (record) => record.id !== excludedId && record.value === value,
  );
}

export function calculatePetAge(birthDate: string | null, now = new Date()) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(birth.getTime()) || birth > now) return null;
  let years = now.getUTCFullYear() - birth.getUTCFullYear();
  let months = now.getUTCMonth() - birth.getUTCMonth();
  if (now.getUTCDate() < birth.getUTCDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months };
}

export function formatPetAge(birthDate: string | null) {
  const age = calculatePetAge(birthDate);
  if (!age) return "Bilinmiyor";
  if (age.years > 0) return `${age.years} yıl ${age.months} ay`;
  return `${age.months} ay`;
}

export function safePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}
