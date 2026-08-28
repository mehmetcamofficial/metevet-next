export function JourneyProgress({ label, count }: { label: string; count: number }) {
  if (count === 0) return null;
  return (
    <div role="status" className="rounded-full border border-white/20 bg-[#0D2922]/72 px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-lg backdrop-blur-md">
      {label}
      <span className="sr-only"> ({count})</span>
    </div>
  );
}

