import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { createClient } from "@/src/lib/supabase/server";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { ServiceForm } from "@/src/components/admin/booking/service-form";
import { getServiceById } from "@/src/lib/admin/booking/booking-readers";
import { updateService } from "@/app/admin/booking-settings/actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  const s = await createClient();
  if (!s) notFound();

  const { data } = await getServiceById(s, id);
  if (!data || data.archived_at) notFound();

  return (
    <AdminShell session={session}>
      <Link
        href="/admin/booking-settings/services"
        className="inline-flex items-center gap-1 text-sm text-[#526a64] hover:underline"
      >
        ← Hizmetler
      </Link>
      <h1 className="mt-2 text-3xl font-semibold">Hizmeti Düzenle</h1>
      <section className="mt-6 rounded-2xl bg-white p-6">
        <ServiceForm action={updateService.bind(null, id)} initial={data} />
      </section>
    </AdminShell>
  );
}
