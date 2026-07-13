import Image from "next/image";

export function ArticleImage({
  src,
  alt,
  sizes,
  priority = false,
}: {
  src?: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgba(205,168,95,0.35),_transparent_35%),linear-gradient(135deg,_#123A30,_#0D2922)] px-8 text-center text-sm font-semibold uppercase tracking-[0.28em] text-[#F4F0E8]">
        MeteVet Bilgi Merkezi
      </div>
    );
  }

  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />;
}
