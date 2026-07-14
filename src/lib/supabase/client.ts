"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/src/types/database";

import { getSupabaseConfig } from "./config";

export function createClient(): SupabaseClient<Database> | null {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  return createBrowserClient<Database>(config.url, config.publishableKey);
}

export function createAuthCallbackClient(): SupabaseClient<Database> | null {
  const config = getSupabaseConfig();
  if (!config) return null;
  const implicit = typeof window !== "undefined" && window.location.hash.includes("access_token=");
  return createBrowserClient<Database>(config.url, config.publishableKey, {
    auth: implicit
      ? { flowType: "implicit", detectSessionInUrl: true }
      : { flowType: "pkce", detectSessionInUrl: true },
  });
}
