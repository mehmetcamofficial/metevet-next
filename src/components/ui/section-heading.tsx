import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
}: SectionHeadingProps) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={cn("flex flex-col gap-4", alignment, className)}>
      <p className="inline-flex w-fit items-center gap-2 rounded-full border border-[#123A30]/10 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#CDA85F]">
        <span className="h-2 w-2 rounded-full bg-[#CDA85F]" />
        {eyebrow}
      </p>
      <div className="space-y-3">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">
          {title}
        </h2>
        <p className="max-w-2xl text-base leading-7 text-[#687A75] sm:text-lg">{description}</p>
      </div>
      {action ? (
        <div className="flex items-center gap-2 text-sm font-semibold text-[#123A30]">
          {action}
          <ArrowRight size={16} />
        </div>
      ) : null}
    </div>
  );
}
