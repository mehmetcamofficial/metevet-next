import { useId } from "react";

export type BrandColorVariant = "dark" | "light";

export function LogoMark({
  size = 40,
  variant = "dark",
  decorative = true,
  title = "MeteVet",
  className = "",
}: {
  size?: number | string;
  variant?: BrandColorVariant;
  decorative?: boolean;
  title?: string;
  className?: string;
}) {
  const titleId = useId();
  const background = variant === "dark" ? "#0D2922" : "#F4F0E8";
  const primaryStroke = "#CDA85F";
  const secondaryStroke = variant === "dark" ? "#FFFFFF" : "#123A30";

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : titleId}
      xmlns="http://www.w3.org/2000/svg"
    >
      {decorative ? null : <title id={titleId}>{title}</title>}
      <rect width="64" height="64" rx="14" fill={background} />
      <path d="M12 45V18l14 17 13-17v27" fill="none" stroke={primaryStroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 18l10 27 10-27" fill="none" stroke={secondaryStroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
