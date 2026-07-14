import Link from "next/link";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";
import { DocumentList } from "@/src/components/admin/documents/document-list";
import { visibleDocumentTypes } from "@/src/lib/admin/documents/document-permissions";
import { documentTypeLabels, documentTypes } from "@/src/lib/admin/documents/document-types";
import type { DocumentType } from "@/src/types/database";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireStaff();
  const q = await searchParams;
  const role = session.profile.role;
  const allowedTypes = visibleDocumentTypes(role, documentTypes);
  const safeType = q.type && allowedTypes.includes(q.type as DocumentType) ? q.type as DocumentType : undefined;
  const s = await createClient();
  if (!s) return <p role="alert">Belgeler yüklenemedi.</p>;
  let query = s.from("generated_documents").select("id,title,document_type,owner_id,pet_id,generated_by,generated_at,status");
  if (safeType) query = query.eq("document_type", safeType);
  if (q.user) query = query.eq("generated_by", q.user);
  if (q.archived === "only") query = query.eq("status", "archived");
  else if (q.archived !== "all") query = query.neq("status", "archived");
  if (q.from) query = query.gte("generated_at", new Date(q.from).toISOString());
  if (q.to) query = query.lte("generated_at", new Date(`${q.to}T23:59:59`).toISOString());
  const { data, error } = await query.order("generated_at", { ascending: q.sort === "oldest" });
  if (error) return <p role="alert">Belge listesi güvenli şekilde yüklenemedi.</p>;
  const [owners, pets, users] = await Promise.all([
    s.from("owners").select("id,full_name"),
    s.from("pets").select("id,name"),
    s.from("profiles").select("id,full_name")
  ]);
  const om = new Map(owners.data?.map(x => [x.id, x.full_name]));
  const pm = new Map(pets.data?.map(x => [x.id, x.name]));
  const um = new Map(users.data?.map(x => [x.id, x.full_name]));
  const term = (q.search ?? "").toLocaleLowerCase("tr");
  const filtered = (data ?? []).filter(x => !term || `${x.owner_id ? om.get(x.owner_id) : ""} ${x.pet_id ? pm.get(x.pet_id) : ""}`.toLocaleLowerCase("tr").includes(term));
  const page = Math.max(1, Number(q.page) || 1);
  const size = 20;
  const items = filtered.slice((page - 1) * size, page * size);
  return <>
    <div className="flex flex-wrap justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold">Belgeler</h1>
        <p className="mt-2 text-[#526a64]">Korumalı klinik PDF arşivi.</p>
      </div>
      <Link href="/admin/documents/generate" className="rounded bg-[#0d2922] px-4 py-2 text-white">Belge Oluştur</Link>
    </div>
    <form className="my-6 grid gap-3 rounded-xl bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
      <input name="search" defaultValue={q.search} placeholder="Sahip veya hayvan ara" className="rounded border p-2" />
      <select name="type" defaultValue={safeType ?? ""} className="rounded border p-2">
        <option value="">Tüm türler</option>
        {allowedTypes.map(x => <option key={x} value={x}>{documentTypeLabels[x]}</option>)}
      </select>
      <select name="user" defaultValue={q.user ?? ""} className="rounded border p-2">
        <option value="">Tüm kullanıcılar</option>
        {users.data?.map(x => <option key={x.id} value={x.id}>{x.full_name}</option>)}
      </select>
      <select name="archived" defaultValue={q.archived ?? "active"} className="rounded border p-2">
        <option value="active">Aktif</option>
        <option value="only">Arşiv</option>
        <option value="all">Tümü</option>
      </select>
      <select name="sort" defaultValue={q.sort ?? "newest"} className="rounded border p-2">
        <option value="newest">En yeni</option>
        <option value="oldest">En eski</option>
      </select>
      <input type="date" name="from" defaultValue={q.from} className="rounded border p-2" />
      <input type="date" name="to" defaultValue={q.to} className="rounded border p-2" />
      <button className="rounded border px-4 py-2">Filtrele</button>
    </form>
    {items.length ? <DocumentList items={items} owners={om} pets={pm} users={um} /> : <div className="rounded-xl bg-white p-8 text-center">
      <h2 className="font-semibold">Belge bulunamadı</h2>
      <p className="text-sm text-[#526a64]">Filtreleri değiştirin veya yeni belge oluşturun.</p>
    </div>}
    <nav className="mt-5 flex justify-between" aria-label="Sayfalama">
      <span>{filtered.length} kayıt</span>
      <div className="flex gap-2">
        {page > 1 ? <Link href={`?page=${page - 1}`} className="rounded border px-3 py-1">Önceki</Link> : null}
        {page * size < filtered.length ? <Link href={`?page=${page + 1}`} className="rounded border px-3 py-1">Sonraki</Link> : null}
      </div>
    </nav>
  </>;
}
