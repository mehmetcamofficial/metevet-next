import Link from "next/link";
import { StatusBadge } from "../status-badge";

export type OwnerListItem = { id: string; full_name: string; phone: string; email: string | null; archived_at: string | null; created_at: string };

export function OwnerCard({ owner }: { owner: OwnerListItem }) {
  return <article className="rounded-xl border border-[#0d2922]/10 bg-white p-5"><div className="flex justify-between gap-3"><h2 className="font-semibold"><Link href={`/admin/owners/${owner.id}`} className="hover:underline">{owner.full_name}</Link></h2><StatusBadge archived={Boolean(owner.archived_at)} /></div><p className="mt-3 text-sm">{owner.phone}</p><p className="mt-1 text-sm text-[#526a64]">{owner.email ?? "E-posta yok"}</p></article>;
}
