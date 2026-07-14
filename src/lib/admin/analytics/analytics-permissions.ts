import type { UserRole } from "@/src/types/database";
export const canViewAppointmentAnalytics = (role: UserRole) => { void role; return true; };
export const canViewClinicalAnalytics = (role: UserRole) => role === "admin" || role === "veterinarian";
export const canExportAnalytics = (role: UserRole) => role === "admin";
export const canConfigureDashboardRange = (role: UserRole) => role === "admin";
