import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "The care was exceptional from the first visit. Everything felt premium, thoughtful, and genuinely personalized.",
    name: "Elif K.",
    pet: "Luna the Golden Retriever",
  },
  {
    quote:
      "My cat was anxious, and the team made the experience feel calm and reassuring. We felt supported every step of the way.",
    name: "Mert T.",
    pet: "Miso the British Shorthair",
  },
  {
    quote:
      "The communication was outstanding. We received clear guidance and gently explained treatment options with confidence.",
    name: "Deniz A.",
    pet: "Beyaz the Maine Coon",
  },
];

export function Testimonials() {
  return (
    <section className="px-6 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d8b36a]/30 bg-[#0f2d24]/70 px-3 py-1 text-sm font-medium uppercase tracking-[0.28em] text-[#d8b36a]">
            <Quote size={16} />
            Testimonials
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Pet owners choose MeteVet for calm, expert, and personal care.
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.03))] p-6 shadow-[0_15px_45px_rgba(0,0,0,0.16)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d8b36a]/15 text-[#d8b36a]">
                <Quote size={18} />
              </div>
              <p className="mt-5 text-base leading-8 text-[#dce7e1]">“{item.quote}”</p>
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="font-semibold text-white">{item.name}</p>
                <p className="mt-1 text-sm text-[#b8c5be]">{item.pet}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
