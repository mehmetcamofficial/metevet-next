import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F4F0E8] px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">404</p>
      <h1 className="mt-4 text-3xl font-semibold text-[#0D2922]">Sayfa bulunamadı.</h1>
      <p className="mt-4 max-w-md text-base leading-8 text-[#687A75]">Aradığınız sayfa taşınmış ya da mevcut değil. Ana sayfaya dönün.</p>
      <Link href="/tr" className="mt-8 rounded-full bg-[#123A30] px-5 py-3 text-sm font-semibold text-white">Ana Sayfaya Dön</Link>
    </main>
  );
}
