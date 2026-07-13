export function LoadingSkeleton() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-16 lg:px-8">
      <div className="h-4 w-32 animate-pulse rounded-full bg-[#DDE9E3]" />
      <div className="h-10 w-3/4 animate-pulse rounded-full bg-[#DDE9E3]" />
      <div className="h-5 w-full max-w-2xl animate-pulse rounded-full bg-[#E8EFEA]" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-56 animate-pulse rounded-[1.7rem] border border-[#0D2922]/10 bg-white" />
        ))}
      </div>
    </div>
  );
}
