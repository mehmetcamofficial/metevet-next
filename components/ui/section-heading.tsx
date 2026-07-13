import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  action?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
}: SectionHeadingProps) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#23483d]/60 bg-[#0f2d24]/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#d8b36a]">
        <span className="h-2 w-2 rounded-full bg-[#d8b36a]" />
        {eyebrow}
      </div>
      <div className="space-y-3">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
        <p className="max-w-2xl text-base leading-7 text-[#b8c5be] sm:text-lg">
          {description}
        </p>
      </div>
      {action ? (
        <div className="flex items-center gap-3 text-sm font-medium text-[#d8b36a]">
          {action}
          <ArrowRight size={16} />
        </div>
      ) : null}
    </div>
  );
}
