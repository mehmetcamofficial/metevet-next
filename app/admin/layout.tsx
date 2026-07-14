import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminFrame } from "@/src/components/admin/admin-frame";
import { createClient } from "@/src/lib/supabase/server";
import type { StaffSession } from "@/src/lib/auth/require-staff";

export const metadata: Metadata = {
  title: "Yönetim Paneli | MeteVet",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  let session: StaffSession | null = null;

  if (supabase) {
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const claims = claimsData?.claims;
    const userId = claims?.sub;
    if (!claimsError && typeof userId === "string") {
      const { data: profile } = await supabase.from("profiles").select("full_name, role, status").eq("id", userId).single();
      if (profile?.status === "active") session = { id: userId, email: typeof claims?.email === "string" ? claims.email : null, profile: { fullName: profile.full_name, role: profile.role, status: "active" } };
    }
  }

  return session ? <AdminFrame session={session}>{children}</AdminFrame> : children;
}
