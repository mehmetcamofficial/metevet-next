import type { UserRole } from "@/src/types/database";

export function canWriteClinicalRecords(role: UserRole) {
  return role === "admin" || role === "veterinarian";
}

export function canPermanentlyDelete(role: UserRole) {
  return role === "admin";
}
