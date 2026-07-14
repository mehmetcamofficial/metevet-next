import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/src/types/database";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export type AdminConfigurationHealth =
  | { ok: true }
  | { ok: false; reason: "missing_url" | "missing_service_role_key" };

export function getAdminConfigurationHealth(): AdminConfigurationHealth {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) return { ok: false, reason: "missing_url" };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return { ok: false, reason: "missing_service_role_key" };
  return { ok: true };
}
