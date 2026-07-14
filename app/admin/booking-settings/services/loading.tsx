export default function Loading() {
  return (
    <div role="status" className="animate-pulse space-y-4">
      <div className="h-10 w-64 rounded bg-black/10" />
      <div className="h-12 w-48 rounded bg-black/10" />
      <div className="h-48 rounded-2xl bg-black/10" />
      <span className="sr-only">Hizmetler yükleniyor</span>
    </div>
  );
}
