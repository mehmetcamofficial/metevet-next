import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";
import { DocumentCreateLinks } from "@/src/components/admin/documents/entity-documents";

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  const { id } = await params;
  const s = await createClient();
  if (!s) notFound();
  const { data } = await s.from("parasite_records").select("pet_id").eq("id", id).single();
  if (!data) notFound();
  return <>{children}<DocumentCreateLinks role={session.profile.role} links={[{ label: "Uygulama Özeti Oluştur", type: "parasite_summary", source: data.pet_id }]} /></>;
}
