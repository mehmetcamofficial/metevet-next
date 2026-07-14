import { notFound } from "next/navigation";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { createClient } from "@/src/lib/supabase/server";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { ClosureForm } from "@/src/components/admin/booking/closure-form";
import { getClosureById, getActiveVeterinarians } from "@/src/lib/admin/booking/booking-readers";
import { updateClosure } from "@/app/admin/booking-settings/actions";

export default async function EditClosurePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;
  const s = await createClient();
  if (!s) notFound();

  const [closureResult, vetsResult] = await Promise.all([
    getClosureById(s, id),
    getActiveVeterinarians(s),
  ]);

  const closure = closureResult.data;
  if (!closure || closure.archived_at) notFound();

  const veterinarians = vetsResult.data ?? [];
  const boundAction = updateClosure.bind(null, id);

  return (
    <AdminShell session={session}>
      <h1 className="text-3xl font-semibold">Kapatma Düzenle</h1>
      <section className="mt-6 rounded-2xl bg-white p-6">
        <ClosureForm
          action={boundAction}
          veterinarians={veterinarians}
          initial={closure}
        />
      </section>
    </AdminShell>
  );
}
