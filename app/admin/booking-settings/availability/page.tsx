import { requireAdmin } from "@/src/lib/auth/require-admin";
import { createClient } from "@/src/lib/supabase/server";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { EmptyState } from "@/src/components/admin/empty-state";
import { AvailabilityForm } from "@/src/components/admin/booking/availability-form";
import { getActiveVeterinarians, getVeterinarianAvailability } from "@/src/lib/admin/booking/booking-readers";
import { saveAvailability } from "@/app/admin/booking-settings/actions";
import type { BookingSettingsState } from "@/app/admin/booking-settings/actions";

type Props = { searchParams: Promise<{ vet?: string }> };

export default async function AvailabilityPage({ searchParams }: Props) {
  const session = await requireAdmin();
  const params = await searchParams;
  const s = await createClient();
  if (!s) return <p role="alert">Veri yüklenemedi.</p>;

  const vetsResult = await getActiveVeterinarians(s);
  const veterinarians = vetsResult.data ?? [];

  const selectedVetId = (params.vet ?? "").trim();

  // If no vet selected, show vet selector with status
  if (!selectedVetId) {
    const vetStatuses = await Promise.all(
      veterinarians.map(async (v) => {
        const availResult = await getVeterinarianAvailability(s, v.id);
        const hasConfig = (availResult.data ?? []).some((r) => r.is_available);
        return { ...v, configured: hasConfig };
      }),
    );

    return (
      <AdminShell session={session}>
        <h1 className="text-3xl font-semibold">Veteriner Çalışma Saatleri</h1>
        <p className="mt-2 text-sm text-[#526a64]">
          Düzenlemek istediğiniz veterineri seçin.
        </p>
        <div className="mt-6 space-y-3">
          {vetStatuses.length > 0 ? (
            vetStatuses.map((v) => (
              <a
                key={v.id}
                href={`/admin/booking-settings/availability?vet=${v.id}`}
                className="flex items-center justify-between rounded-xl bg-white p-5 hover:bg-[#0d2922]/5 transition-colors"
              >
                <div>
                  <p className="font-semibold">{v.full_name}</p>
                  <p className="text-sm text-[#526a64]">
                    {v.configured ? "Uygunluk tanımlı" : "Uygunluk tanımlanmamış"}
                  </p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    v.configured
                      ? "bg-[#0d2922]/10 text-[#0d2922]"
                      : "bg-[#cda85f]/20 text-[#cda85f]"
                  }`}
                >
                  {v.configured ? "Yapılandırılmış" : "Yapılandırılmamış"}
                </span>
              </a>
            ))
          ) : (
            <EmptyState
              title="Aktif veteriner bulunamadı"
              description="Sistemde aktif veteriner kaydı bulunmuyor."
            />
          )}
        </div>
      </AdminShell>
    );
  }

  // Vet selected — fetch availability and render form
  const availResult = await getVeterinarianAvailability(s, selectedVetId);
  const availabilityData = availResult.data ?? [];
  const initialState: BookingSettingsState = { message: null };

  return (
    <AdminShell session={session}>
      <h1 className="text-3xl font-semibold">Veteriner Çalışma Saatleri</h1>
      <section className="mt-6 rounded-2xl bg-white p-6">
        <AvailabilityForm
          action={saveAvailability}
          veterinarians={veterinarians}
          selectedVetId={selectedVetId}
          availabilityData={availabilityData}
          state={initialState}
        />
      </section>
    </AdminShell>
  );
}
