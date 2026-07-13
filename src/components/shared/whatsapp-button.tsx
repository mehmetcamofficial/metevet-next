import Link from "next/link";
import { MessageCircleMore } from "lucide-react";
import { siteConfig } from "@/src/data/site";

export function WhatsappButton({ label }: { label: string }) {
  return (
    <Link
      href={`https://wa.me/${siteConfig.whatsappNumber}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#123A30] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_50px_rgba(18,58,48,0.28)] transition hover:brightness-110 sm:bottom-6 sm:right-6"
      aria-label={label}
    >
      <MessageCircleMore size={18} />
      {label}
    </Link>
  );
}
