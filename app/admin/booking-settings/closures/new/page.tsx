import { requireAdmin } from "@/src/lib/auth/require-admin";
import { createClient } from "@/src/lib/supabase/server";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { ClosureForm } from "@/src/components/admin/booking/closure-form";
import { getActiveVeterinarians } from "@/src/lib/admin/booking/booking-readers";
import { createClosure } from "@/app/admin/booking-settings/actions";

export default async function NewClosurePage() {
  const session = await requireAdmin();
  const s = await createClient();
  if (!s) return <p role="alert">Veri yüklenemedi.</p>;

  const vetsResult = await getActiveVeterinarians(s);
  const veterinarians = vetsResult.data ?? [];

  return (
    <AdminShell session={session}>
      <h1 className="text-3xl font-semibold">Yeni Kapatma</h1>
      <section className="mt-6 rounded-2xl bg-white p-6">
        <ClosureForm action={createClosure} veterinarians={veterinarians} />
      </section>
    </AdminShell>
  );
}
