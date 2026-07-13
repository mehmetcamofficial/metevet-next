import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/src/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response, userId, configured } = await updateSession(request);
  const isLogin = request.nextUrl.pathname === "/admin/login";

  let result = response;

  if (!configured && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "?configuration=missing";
    result = NextResponse.redirect(url);
  } else if (!userId && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    result = NextResponse.redirect(url);
  } else if (userId && isLogin) {
    result = NextResponse.redirect(new URL("/admin", request.url));
  }

  result.headers.set("Cache-Control", "private, no-store, max-age=0");
  result.headers.set("Pragma", "no-cache");
  result.headers.set("Expires", "0");

  return result;
}

export const config = {
  matcher: ["/admin/:path*"],
};
