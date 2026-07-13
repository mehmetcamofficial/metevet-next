import Link from "next/link";
import { DataTable } from "../data-table";
import { StatusBadge } from "../status-badge";
import { OwnerCard, type OwnerListItem } from "./owner-card";

export function OwnerList({ owners }: { owners: OwnerListItem[] }) {
  return <><DataTable label="Hayvan sahipleri" headings={["Ad Soyad", "Telefon", "E-posta", "Durum", "Kayıt"]}>{owners.map((owner) => <tr key={owner.id}><th scope="row" className="px-5 py-4 font-semibold"><Link href={`/admin/owners/${owner.id}`} className="hover:underline focus-visible:outline-2">{owner.full_name}</Link></th><td className="px-5 py-4">{owner.phone}</td><td className="px-5 py-4">{owner.email ?? "—"}</td><td className="px-5 py-4"><StatusBadge archived={Boolean(owner.archived_at)} /></td><td className="px-5 py-4">{new Intl.DateTimeFormat("tr-TR").format(new Date(owner.created_at))}</td></tr>)}</DataTable><div className="grid gap-4 md:hidden">{owners.map((owner) => <OwnerCard key={owner.id} owner={owner} />)}</div></>;
}
