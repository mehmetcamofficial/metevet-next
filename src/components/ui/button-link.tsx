import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  external?: boolean;
};

export function ButtonLink({ href, children, variant = "primary", className, external = false }: ButtonLinkProps) {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/20";

  const variants = {
    primary: "bg-[#123A30] text-white shadow-[0_14px_35px_rgba(18,58,48,0.18)] hover:-translate-y-0.5 hover:bg-[#0D2922]",
    secondary: "border border-[#123A30]/15 bg-white text-[#123A30] hover:border-[#123A30] hover:bg-[#F4F0E8]",
    ghost: "bg-[#DDE9E3] text-[#123A30] hover:bg-[#D0E2D8]",
  };

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={cn(baseClasses, variants[variant], className)}
    >
      {children}
      <ArrowRight size={16} className="shrink-0" />
    </Link>
  );
}
