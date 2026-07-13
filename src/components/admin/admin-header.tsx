import { logoutAction } from "@/app/admin/actions";
import type { StaffSession } from "@/src/lib/auth/require-staff";

const roleLabels = { admin: "Yönetici", veterinarian: "Veteriner Hekim", staff: "Personel" } as const;

export function AdminHeader({ session }: { session: StaffSession }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#0d2922]/10 bg-white px-5 py-4 lg:px-8">
      <div>
        <p className="font-semibold text-[#0d2922]">{session.profile.fullName}</p>
        <p className="text-xs text-[#526a64]">{roleLabels[session.profile.role]}</p>
      </div>
      <form action={logoutAction}>
        <button className="rounded-lg border border-[#0d2922]/20 px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d2922]" type="submit">Çıkış Yap</button>
      </form>
    </header>
  );
}
