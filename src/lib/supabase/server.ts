import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/src/types/database";

import { getSupabaseConfig } from "./config";

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
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The root proxy refreshes them.
        }
      },
    },
  });
}
