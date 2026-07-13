import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-[#0d2922]/25 bg-white p-10 text-center"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 text-sm text-[#526a64]">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div>;
}
