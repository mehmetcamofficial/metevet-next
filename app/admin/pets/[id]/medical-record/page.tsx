import { notFound } from "next/navigation";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { getPetMedicalRecord, getTimelineEvents } from "@/src/lib/admin/medical-record/medical-record-readers";
import { MedicalRecordHeader } from "@/src/components/admin/medical-record/medical-record-header";
import { TimelineClient } from "@/src/components/admin/medical-record/timeline-client";

export default async function MedicalRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date_start?: string; date_end?: string; event_type?: string }>;
}) {
  const session = await requireStaff();
  const { id } = await params;
  const sp = await searchParams;

  const s = await createClient();
  if (!s) return <p role="alert">Veri yüklenemedi.</p>;

  // Validate pet ID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  // Load pet and owner
  const pet = await getPetMedicalRecord(s, id);
  if (!pet) notFound();

  // Verify owner relationship
  if (!pet.owner_id) {
    return <p role="alert">Hayvan sahibi bilgisi eksik.</p>;
  }

  // Load timeline events (bounded to last 6 months by default)
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const dateStart = sp.date_start ?? sixMonthsAgo.toISOString();
  const dateEnd = sp.date_end ?? now.toISOString();
  const eventType = sp.event_type;

  const events = await getTimelineEvents(s, id, dateStart, dateEnd);

  // Filter by event type if specified
  const filteredEvents = eventType && eventType !== "all"
    ? events.filter((e) => e.event_type === eventType)
    : events;

  // Role-based phone visibility
  const showPhone = session.profile.role === "admin" || session.profile.role === "veterinarian";

  return (
    <AdminShell session={session}>
      <MedicalRecordHeader
        pet={pet}
        showPhone={showPhone}
        role={session.profile.role}
      />
      <TimelineClient
        events={filteredEvents}
        petId={id}
        dateStart={dateStart}
        dateEnd={dateEnd}
        eventType={eventType ?? "all"}
      />
    </AdminShell>
  );
}
