import Image from "next/image";
import { Award, GraduationCap, HeartPulse, Stethoscope } from "lucide-react";

export function DoctorPreview() {
  return (
    <section id="doctor" className="px-6 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.03))] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.24)] lg:grid-cols-[0.95fr_1.05fr] lg:p-12">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0f2d24] p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(216,179,106,0.25),_transparent_35%)]" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.3rem] bg-[#d7e4de]">
            <Image
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80"
              alt="Dr. Onur Metehan Çakır"
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d8b36a]/30 bg-[#0f2d24]/70 px-3 py-1 text-sm font-medium uppercase tracking-[0.28em] text-[#d8b36a]">
            <Stethoscope size={16} />
            Doctor profile
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Trusted by families who want the best for their pets.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#b8c5be]">
            Dr. Onur Metehan Çakır brings a preventive, science-led philosophy to veterinary medicine, making every visit feel thoughtful, calm, and deeply personal.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
              <GraduationCap className="text-[#d8b36a]" size={18} />
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#d8b36a]">
                Education
              </p>
              <p className="mt-2 text-sm leading-6 text-[#dce7e1]">
                Mehmet Akif Ersoy University, Veterinary Faculty, 2020
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
              <Award className="text-[#d8b36a]" size={18} />
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#d8b36a]">
                Experience
              </p>
              <p className="mt-2 text-sm leading-6 text-[#dce7e1]">
                4+ years of clinical experience in preventive and family medicine
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-[#d8b36a]/20 bg-[#0f2d24]/70 p-5">
            <div className="flex items-start gap-3">
              <HeartPulse className="mt-1 text-[#d8b36a]" size={20} />
              <p className="text-sm leading-7 text-[#dce7e1]">
                “Veterinary medicine is not only about treating diseases. It is about creating a long and healthy life for every pet through preventive medicine, scientific care, and strong communication with pet owners.”
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
