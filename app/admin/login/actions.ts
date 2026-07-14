"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/src/lib/supabase/server";

export type LoginState = {
  error: string | null;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !password) {
    return { error: "E-posta ve şifre alanları zorunludur." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      error:
        "Supabase bağlantısı henüz yapılandırılmadı. Ortam değişkenlerini kontrol edin.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-posta veya şifre hatalı." };
  }

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  const { data: profile } = typeof userId === "string"
    ? await supabase.from("profiles").select("role,status").eq("id", userId).maybeSingle()
    : { data: null };
  if (!profile || profile.status !== "active" || !["admin", "veterinarian", "staff"].includes(profile.role)) {
    await supabase.auth.signOut();
    return { error: "Hesabınız aktif değil veya geçerli bir personel profili bulunmuyor." };
  }

  redirect("/admin");
}
