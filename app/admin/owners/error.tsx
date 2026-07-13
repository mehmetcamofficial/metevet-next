"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="p-8"><div role="alert" className="rounded-xl bg-red-50 p-6"><h1 className="font-semibold">Kayıtlar yüklenemedi</h1><button onClick={reset} className="mt-4 rounded-lg border px-4 py-2">Tekrar Dene</button></div></main>; }
