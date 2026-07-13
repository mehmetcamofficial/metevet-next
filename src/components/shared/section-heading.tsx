type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex flex-col gap-3 ${alignment}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{eyebrow}</p>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">{title}</h2>
      <p className="max-w-2xl text-base leading-8 text-[#687A75]">{description}</p>
    </div>
  );
}
