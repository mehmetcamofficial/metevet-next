import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/src/lib/supabase/server";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
};

export async function requireUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/admin/login?configuration=missing");
  }

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const subject = claims?.sub;

  if (error || typeof subject !== "string") {
    redirect("/admin/login");
  }

  return {
    id: subject,
    email: typeof claims?.email === "string" ? claims.email : null,
  };
}
