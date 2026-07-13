import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/src/types/database";

import { getSupabaseConfig } from "./config";

export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();
  let response = NextResponse.next({ request });

  if (!config) {
    return { response, userId: null, configured: false };
  }

  const supabase = createServerClient<Database>(
    config.url,
    config.publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const subject = data?.claims?.sub;

  return {
    response,
    userId: !error && typeof subject === "string" ? subject : null,
    configured: true,
  };
}
