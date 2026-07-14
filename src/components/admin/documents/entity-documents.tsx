import Link from "next/link";

import { createClient } from "@/src/lib/supabase/server";
import type { DocumentType } from "@/src/types/database";

import { DocumentStatusBadge } from "./document-status-badge";
import { DocumentTypeBadge } from "./document-type-badge";

export function DocumentCreateLinks({ links }: { links: Array<{ label: string; type: DocumentType; source: string; preview?: string }> }) {
  return <section className="mt-6 rounded-2xl bg-white p-6">
    <h2 className="text-xl font-semibold">Belgeler</h2>
    <div className="mt-4 flex flex-wrap gap-3">
      {links.map((item) => <div key={`${item.type}-${item.source}`} className="flex items-center gap-2">
        <Link href={`/admin/documents/generate?type=${item.type}&source=${item.source}`} className="rounded border px-4 py-2 text-sm font-medium">{item.label}</Link>
        {item.preview ? <Link href={item.preview} className="text-sm underline">Önizle</Link> : null}
      </div>)}
    </div>
  </section>;
}

export async function RecentDocuments({ ownerId, petId }: { ownerId?: string; petId?: string }) {
  const s = await createClient();
  if (!s) return null;
  let query = s.from("generated_documents").select("id,title,document_type,status,generated_at");
  query = petId ? query.eq("pet_id", petId) : query.eq("owner_id", ownerId!);
  const { data } = await query.order("generated_at", { ascending: false }).limit(5);
  return <section className="mt-6 rounded-2xl bg-white p-6">
    <div className="flex justify-between"><h2 className="text-xl font-semibold">Son Belgeler</h2><Link href="/admin/documents" className="text-sm underline">Tüm belgeler</Link></div>
    {data?.length ? <ul className="mt-4 divide-y">{data.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><Link href={`/admin/documents/${item.id}`} className="font-medium underline">{item.title}</Link><div className="mt-2"><DocumentTypeBadge type={item.document_type}/></div></div><DocumentStatusBadge status={item.status}/></li>)}</ul> : <p className="mt-4 text-sm text-[#526a64]">Henüz üretilmiş belge yok.</p>}
  </section>;
}
