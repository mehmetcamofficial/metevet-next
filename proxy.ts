import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/src/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response, userId, configured } = await updateSession(request);
  const publicAuthRoutes = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];
  const isPublicAuth = publicAuthRoutes.includes(request.nextUrl.pathname);

  let result = response;

  if (!configured && !isPublicAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "?configuration=missing";
    result = NextResponse.redirect(url);
  } else if (!userId && !isPublicAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    result = NextResponse.redirect(url);
  }

  result.headers.set("Cache-Control", "private, no-store, max-age=0");
  result.headers.set("Pragma", "no-cache");
  result.headers.set("Expires", "0");

  return result;
}

export const config = {
  matcher: ["/admin/:path*"],
};
