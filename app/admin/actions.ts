"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/src/lib/supabase/server";

export async function logoutAction() {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/admin/login");
}
