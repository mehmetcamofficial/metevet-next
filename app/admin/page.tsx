import { logoutAction } from "./actions";

import { requireStaff } from "@/src/lib/auth/require-staff";

const roleLabels = {
  admin: "Yönetici",
  veterinarian: "Veteriner Hekim",
  staff: "Personel",
} as const;

export default async function AdminPage() {
  const session = await requireStaff();

  return (
    <main className="min-h-screen bg-[#f4f0e8] px-5 py-12 text-[#0d2922]">
      <section className="mx-auto max-w-3xl rounded-2xl border border-[#0d2922]/10 bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-[#8a6c32] uppercase">
              MeteVet
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              MeteVet Yönetim Paneli
            </h1>
            <p className="mt-4 text-[#39554e]">
              Hoş geldiniz, {session.profile.fullName}.
            </p>
            <p className="mt-1 text-sm text-[#526a64]">
              Rol: {roleLabels[session.profile.role]}
            </p>
          </div>
          <form action={logoutAction}>
            <button
              className="min-h-11 rounded-lg border border-[#0d2922]/25 px-5 py-2.5 font-medium transition-colors hover:bg-[#0d2922] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d2922]"
              type="submit"
            >
              Çıkış Yap
            </button>
          </form>
        </div>

        <div className="mt-10 rounded-xl border border-[#cda85f]/35 bg-[#cda85f]/10 p-5">
          <h2 className="font-semibold">Yönetim altyapısı hazır</h2>
          <p className="mt-2 text-sm leading-6 text-[#39554e]">
            Klinik yönetim modülleri sonraki aşamalarda bu korumalı alana
            eklenecektir.
          </p>
        </div>
      </section>
    </main>
  );
}
