const stats = [
  { value: "4.9/5", label: "Average pet owner rating" },
  { value: "98%", label: "Preventive care adherence" },
  { value: "24/7", label: "Guidance for urgent questions" },
  { value: "1:1", label: "Personalized treatment planning" },
];

export function Statistics() {
  return (
    <section className="px-6 py-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 rounded-[2rem] border border-white/10 bg-[#0f2d24]/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[1.25rem] border border-white/10 bg-white/5 p-5">
            <p className="text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
            <p className="mt-2 text-sm leading-6 text-[#b8c5be]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
