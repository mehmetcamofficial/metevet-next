import type { Locale } from "@/types";
import { LogoMark, type BrandColorVariant } from "@/src/components/brand/logo-mark";
import { Wordmark } from "@/src/components/brand/wordmark";

export type LogoLayout = "icon-only" | "horizontal" | "compact";

export function Logo({
  locale = "tr",
  variant = "dark",
  layout = "horizontal",
  markSize = 42,
  className = "",
  descriptorClassName = "",
}: {
  locale?: Locale;
  variant?: BrandColorVariant;
  layout?: LogoLayout;
  markSize?: number;
  className?: string;
  descriptorClassName?: string;
}) {
  if (layout === "icon-only") {
    return <LogoMark size={markSize} variant={variant} className={className} />;
  }

  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <LogoMark size={markSize} variant={variant} className="shrink-0" />
      <Wordmark locale={locale} variant={variant} compact={layout === "compact"} descriptorClassName={descriptorClassName} />
    </span>
  );
}
