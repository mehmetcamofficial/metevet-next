import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/src/types/database";

import { getSupabaseConfig } from "./config";

/**
 * Writable Supabase client for Server Actions and Route Handlers.
 *
 * This client can both read and write auth cookies. Cookie-setting failures
 * will propagate as errors rather than being silently swallowed.
 *
 * Use this in:
 * - Server Actions ("use server")
 * - Route Handlers (app/api/**)
 *
 * Do NOT use this in Server Components (they cannot write cookies).
 */
export async function createServerActionClient() {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In Server Actions and Route Handlers, cookie writes must succeed.
        // If they fail, propagate the error rather than silently ignoring it.
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
