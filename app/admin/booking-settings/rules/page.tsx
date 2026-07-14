import { requireAdmin } from "@/src/lib/auth/require-admin";
import { createClient } from "@/src/lib/supabase/server";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { BookingRulesForm } from "@/src/components/admin/booking/booking-rules-form";
import { getBookingRules } from "@/src/lib/admin/booking/booking-readers";
import { updateBookingRules } from "@/app/admin/booking-settings/actions";

export default async function BookingRulesPage() {
  const session = await requireAdmin();
  const s = await createClient();
  if (!s) return <p role="alert">Veri yüklenemedi.</p>;

  const rulesResult = await getBookingRules(s);
  const rules = rulesResult.data;

  if (!rules) {
    return (
      <AdminShell session={session}>
        <h1 className="text-3xl font-semibold">Rezervasyon Kuralları</h1>
        <div role="alert" className="mt-6 rounded-2xl bg-[#cda85f]/10 border border-[#cda85f]/30 p-6">
          <p className="font-semibold text-[#cda85f]">Rezervasyon kuralları tanımlanmamış</p>
          <p className="mt-2 text-sm text-[#526a64]">
            Sistemde henüz rezervasyon kuralları bulunmuyor. Lütfen veri temeli migration&apos;ını kontrol edin.
          </p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell session={session}>
      <h1 className="text-3xl font-semibold">Rezervasyon Kuralları</h1>
      <section className="mt-6 rounded-2xl bg-white p-6">
        <BookingRulesForm action={updateBookingRules} initial={rules} />
      </section>
    </AdminShell>
  );
}
