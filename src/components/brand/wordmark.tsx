import type { Locale } from "@/types";
import type { BrandColorVariant } from "@/src/components/brand/logo-mark";

export function Wordmark({
  locale,
  variant = "dark",
  compact = false,
  className = "",
  descriptorClassName = "",
}: {
  locale: Locale;
  variant?: BrandColorVariant;
  compact?: boolean;
  className?: string;
  descriptorClassName?: string;
}) {
  const primary = variant === "dark" ? "text-[#0D2922]" : "text-white";
  const secondary = variant === "dark" ? "text-[#536A64]" : "text-[#DDE9E3]";

  return (
    <span className={`min-w-0 leading-none ${className}`}>
      <span className={`block whitespace-nowrap text-[1.05rem] font-semibold tracking-[0.02em] ${primary}`}>MeteVet</span>
      {compact ? null : (
        <span className={`mt-1 block whitespace-nowrap text-[0.68rem] font-medium tracking-[0.11em] ${secondary} ${descriptorClassName}`}>
          {locale === "tr" ? "Veteriner Kliniği" : "Veterinary Clinic"}
        </span>
      )}
    </span>
  );
}
