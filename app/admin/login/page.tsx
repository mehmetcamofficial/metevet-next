import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/src/lib/supabase/config";
import { createClient } from "@/src/lib/supabase/server";

import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = await createClient();
    const { data, error } = (await supabase?.auth.getClaims()) ?? {
      data: null,
      error: null,
    };

    if (!error && typeof data?.claims?.sub === "string") {
      redirect("/admin");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f0e8] px-5 py-12 text-[#0d2922]">
      <section className="w-full max-w-md rounded-2xl border border-[#0d2922]/10 bg-white p-6 shadow-sm sm:p-9">
        <p className="text-sm font-semibold tracking-[0.16em] text-[#8a6c32] uppercase">
          MeteVet
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Yönetim Paneli Girişi</h1>
        <p className="mt-3 text-sm leading-6 text-[#526a64]">
          Yalnızca yetkili klinik personeli giriş yapabilir.
        </p>

        {configured ? (
          <LoginForm />
        ) : (
          <div
            className="mt-8 rounded-xl border border-[#cda85f]/50 bg-[#cda85f]/10 p-4 text-sm leading-6"
            role="status"
          >
            <strong>Supabase yapılandırması gerekli.</strong>
            <p className="mt-1 text-[#526a64]">
              Yönetici girişi için gerekli ortam değişkenleri henüz tanımlı
              değil. Public site bu durumdan etkilenmez.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
