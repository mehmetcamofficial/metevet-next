import type { UserRole } from "@/src/types/database";

export const personnelRoles: UserRole[] = ["admin", "veterinarian", "staff"];
export type PersonnelStatus = "active" | "inactive";

export function isPersonnelRole(value: string): value is UserRole {
  return personnelRoles.includes(value as UserRole);
}

export function normalizePersonnelEmail(value: string) {
  const email = value.trim().toLocaleLowerCase("en-US");
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null;
}

export function normalizePersonnelPhone(value: string) {
  const clean = value.trim();
  if (!clean) return null;
  const digits = clean.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : undefined;
}

export function canMutatePersonnel(actorId: string, targetId: string, actorRole: UserRole) {
  return actorRole === "admin" && actorId !== targetId;
}

export function passwordErrors(password: string, confirmation: string) {
  if (password !== confirmation) return "Şifreler eşleşmiyor.";
  if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return "Şifre en az 12 karakter; büyük harf, küçük harf, sayı ve özel karakter içermelidir.";
  }
  return null;
}
