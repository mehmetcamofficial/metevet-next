import Link from "next/link";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { ServiceForm } from "@/src/components/admin/booking/service-form";
import { createService } from "@/app/admin/booking-settings/actions";

export default async function Page() {
  const session = await requireAdmin();

  return (
    <AdminShell session={session}>
      <Link
        href="/admin/booking-settings/services"
        className="inline-flex items-center gap-1 text-sm text-[#526a64] hover:underline"
      >
        ← Hizmetler
      </Link>
      <h1 className="mt-2 text-3xl font-semibold">Yeni Hizmet</h1>
      <section className="mt-6 rounded-2xl bg-white p-6">
        <ServiceForm action={createService} />
      </section>
    </AdminShell>
  );
}
