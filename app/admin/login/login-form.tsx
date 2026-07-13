"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label className="block text-sm font-medium" htmlFor="email">
          E-posta
        </label>
        <input
          autoComplete="email"
          className="mt-2 min-h-12 w-full rounded-lg border border-[#0d2922]/25 bg-white px-4 outline-none transition focus:border-[#0d2922] focus:ring-2 focus:ring-[#cda85f]/50"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="password">
          Şifre
        </label>
        <input
          autoComplete="current-password"
          className="mt-2 min-h-12 w-full rounded-lg border border-[#0d2922]/25 bg-white px-4 outline-none transition focus:border-[#0d2922] focus:ring-2 focus:ring-[#cda85f]/50"
          id="password"
          minLength={6}
          name="password"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <p
          aria-live="polite"
          className="rounded-lg border border-red-700/20 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button
        className="min-h-12 w-full rounded-lg bg-[#0d2922] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#123a30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cda85f] disabled:cursor-wait disabled:opacity-65"
        disabled={pending}
        type="submit"
      >
        {pending ? "Giriş yapılıyor…" : "Giriş Yap"}
      </button>
    </form>
  );
}
