"use server";

import { requireAdmin } from "@/src/lib/auth/require-admin";
import { getAvailableSlots } from "@/src/lib/admin/booking/availability-engine";
import type { EngineResponse } from "@/src/lib/admin/booking/availability-engine";

export async function previewSlots(
  serviceId: string,
  date: string,
  veterinarianId?: string,
): Promise<EngineResponse> {
  // Admin-only guard
  await requireAdmin();

  // Validate inputs
  if (!serviceId || !date) return { reason: "Hizmet ve tarih zorunlu." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { reason: "Geçersiz tarih formatı." };

  return getAvailableSlots(serviceId, date, { veterinarianId });
}
