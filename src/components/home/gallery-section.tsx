import Image from "next/image";
import { Reveal } from "@/src/components/ui/reveal";

const galleryImages = [
  {
    src: "/images/clinic/clinic-exam-room.png",
    alt: "MeteVet muayene odası",
  },
  {
    src: "/images/clinic/clinic-treatment-room.png",
    alt: "MeteVet tedavi odası",
  },
  {
    src: "/images/clinic/clinic-waiting.png",
    alt: "MeteVet bekleme alanı",
  },
];

export function GallerySection() {
  return (
    <section className="px-6 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#0D2922]/10 bg-white p-8 shadow-[0_20px_60px_rgba(13,41,34,0.08)] lg:p-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">Galeri</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">Klinik deneyimini yansıtan alanlar</h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {galleryImages.map((image, index) => (
            <Reveal key={image.src} delay={index * 0.04}>
              <div className="overflow-hidden rounded-[1.5rem] border border-[#0D2922]/10 bg-[#F4F0E8] p-2">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.2rem]">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={800}
                    height={1000}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
