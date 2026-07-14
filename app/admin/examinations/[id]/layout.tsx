import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ExaminationPreventiveActions } from "@/src/components/admin/vaccines/examination-preventive-actions";
import { DocumentCreateLinks } from "@/src/components/admin/documents/entity-documents";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params; const session = await requireStaff(); const s = await createClient(); if (!s) notFound();
  const { data } = await s.from("examinations").select("pet_id,veterinarian_id,appointment_id,status").eq("id", id).single(); if (!data) notFound();
  return <>{children}<ExaminationPreventiveActions petId={data.pet_id} vetId={data.veterinarian_id} appointmentId={data.appointment_id} role={session.profile.role}/>{data.status === "finalized" ? <DocumentCreateLinks links={[{ label: "Muayene Özeti Oluştur", type: "examination_summary", source: id, preview: `/admin/documents/examination/${id}` }, { label: "Kontrol Talimatları Oluştur", type: "follow_up_instructions", source: id }]} /> : null}</>;
}
