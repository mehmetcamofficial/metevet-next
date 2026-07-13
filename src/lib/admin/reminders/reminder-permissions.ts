import type { UserRole } from "@/src/types/database";
export const canManageReminders = (role: UserRole) => role === "admin" || role === "veterinarian";
export const canDeleteReminders = (role: UserRole) => role === "admin";
export const canEditTemplates = canManageReminders;
