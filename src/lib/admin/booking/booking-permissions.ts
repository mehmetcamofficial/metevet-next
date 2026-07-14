import type { UserRole } from "@/src/types/database";

/**
 * Authorization model for booking management:
 *   admin  → full CRUD on services, availability, closures, booking rules
 *   vet    → read services/rules/closures; manage own availability only
 *   staff  → read services/schedule info; no write on any booking config
 *   anon   → read online-bookable services + public booking rules only
 */

export function canManageServices(role: UserRole): boolean {
  return role === "admin";
}

export function canManageAvailability(role: UserRole, vetId?: string, userId?: string): boolean {
  if (role === "admin") return true;
  if (role === "veterinarian" && vetId === userId) return true;
  return false;
}

export function canManageClosures(role: UserRole): boolean {
  return role === "admin";
}

export function canManageBookingRules(role: UserRole): boolean {
  return role === "admin";
}

export function canReadBookingConfig(role: UserRole): boolean {
  return role === "admin" || role === "veterinarian" || role === "staff";
}
