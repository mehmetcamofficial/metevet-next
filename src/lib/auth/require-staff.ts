import "server-only";

import { notFound } from "next/navigation";

import { createClient } from "@/src/lib/supabase/server";
import type { UserRole } from "@/src/types/database";

import { requireUser, type AuthenticatedUser } from "./require-user";

export type StaffSession = AuthenticatedUser & {
  profile: {
    fullName: string;
    role: UserRole;
  };
};

export async function requireStaff(): Promise<StaffSession> {
  const user = await requireUser();
  const supabase = await createClient();

  if (!supabase) {
    notFound();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    notFound();
  }

  return {
    ...user,
    profile: { fullName: data.full_name, role: data.role },
  };
}
