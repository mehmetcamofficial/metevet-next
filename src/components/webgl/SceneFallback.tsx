import Image from "next/image";

export function SceneFallback({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative h-full min-h-[320px] w-full overflow-hidden bg-[#123A30] ${className}`.trim()}>
      <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" priority={false} />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0D2922]/70 via-transparent to-[#0D2922]/15" />
    </div>
  );
}

