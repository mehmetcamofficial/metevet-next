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
