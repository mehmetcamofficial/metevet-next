import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/src/types/database";

import { getSupabaseConfig } from "./config";

/**
 * Read-only Supabase client for Server Components.
 *
 * This client can read auth cookies but cannot write them. Cookie-setting
 * attempts will be silently ignored because Server Components cannot modify
 * the response. The proxy/middleware handles session refresh on each request.
 *
 * Use this in:
 * - Server Components (pages, layouts)
 * - Any code that runs in a Server Component context
 *
 * For Server Actions and Route Handlers, use createServerActionClient() instead.
 */
export async function createClient() {
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
        // Server Components cannot write cookies to the response.
        // This is expected behavior, not an error.
        // The proxy/middleware refreshes the session on each request.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Expected in Server Components. Ignore silently.
          // Do NOT log cookie names or values.
        }
      },
    },
  });
}
