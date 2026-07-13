import type { ReactNode } from "react";

export function DataTable({ headings, children, label }: { headings: string[]; children: ReactNode; label: string }) {
  return <div className="hidden overflow-x-auto rounded-2xl border border-[#0d2922]/10 bg-white md:block"><table className="w-full text-left text-sm"><caption className="sr-only">{label}</caption><thead className="border-b border-[#0d2922]/10 bg-[#dde9e3]/55"><tr>{headings.map((heading) => <th key={heading} scope="col" className="px-5 py-4 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[#0d2922]/10">{children}</tbody></table></div>;
}
