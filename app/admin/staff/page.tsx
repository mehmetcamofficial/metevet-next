import Link from "next/link";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { createAdminClient, getAdminConfigurationHealth } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";
import { isPersonnelRole } from "@/src/lib/admin/personnel";
const labels = {
  admin: "Yönetici",
  veterinarian: "Veteriner Hekim",
  staff: "Personel",
} as const;
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const p = await searchParams,
    s = await createClient(),
    health = getAdminConfigurationHealth(),
    admin = createAdminClient();
  if (!health.ok)
    return (
      <p role="alert">Personel yönetimi yapılandırması eksik: {health.reason === "missing_service_role_key" ? "SUPABASE_SERVICE_ROLE_KEY" : "NEXT_PUBLIC_SUPABASE_URL"}. Ortam değişikliğinden sonra geliştirme sunucusunu yeniden başlatın.</p>
    );
  if (!s || !admin) return <p role="alert">Personel yönetimi Supabase hizmetine bağlanamadı. Ağ ve proje durumunu kontrol edin.</p>;
  const page = Math.max(1, Number(p.page) || 1),
    size = 20,
    q = (p.q ?? "")
      .trim()
      .replace(/[,()%_]/g, "")
      .slice(0, 80);
  const privateMatches = q
    ? await s
        .from("personnel_private_profiles")
        .select("id")
        .ilike("email", `%${q}%`)
        .limit(50)
    : { data: [] };
  let query = s
    .from("profiles")
    .select("id,full_name,role,status,created_at", { count: "exact" });
  if (q) {
    const ids = (privateMatches.data ?? []).map((x) => x.id);
    query = ids.length
      ? query.or(`full_name.ilike.%${q}%,id.in.(${ids.join(",")})`)
      : query.ilike("full_name", `%${q}%`);
  }
  if (isPersonnelRole(p.role ?? ""))
    query = query.eq("role", p.role as "admin" | "veterinarian" | "staff");
  if (["active", "inactive"].includes(p.status ?? ""))
    query = query.eq("status", p.status as "active" | "inactive");
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * size, page * size - 1);
  if (error) return <p role="alert">Personel kayıtları yüklenemedi.</p>;
  const [auth, privateRows] = await Promise.all([
    Promise.all((data ?? []).map((x) => admin.auth.admin.getUserById(x.id))),
    (data ?? []).length
      ? s
          .from("personnel_private_profiles")
          .select("id,email,phone")
          .in(
            "id",
            (data ?? []).map((x) => x.id),
          )
      : Promise.resolve({ data: [] }),
  ]);
  const meta = new Map(auth.map((x, i) => [(data ?? [])[i].id, x.data.user])),
    privateMap = new Map((privateRows.data ?? []).map((x) => [x.id, x]));
  return (
    <>
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Personel</h1>
          <p className="mt-2 text-[#526a64]">
            Roller, davetler ve hesap durumları.
          </p>
        </div>
        <Link
          href="/admin/staff/invite"
          className="rounded bg-[#0d2922] px-4 py-2 text-white"
        >
          Personel Davet Et
        </Link>
      </div>
      <form className="my-6 grid gap-3 rounded-xl bg-white p-4 sm:grid-cols-4">
        <input
          name="q"
          defaultValue={p.q}
          placeholder="Ad veya e-posta ara"
          className="rounded border p-2"
        />
        <select
          name="role"
          defaultValue={p.role ?? ""}
          className="rounded border p-2"
        >
          <option value="">Tüm roller</option>
          {Object.entries(labels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={p.status ?? ""}
          className="rounded border p-2"
        >
          <option value="">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
        </select>
        <button className="rounded border px-4">Filtrele</button>
      </form>
      <div className="space-y-3 md:hidden">
        {data?.map((x) => (
          <Card
            key={x.id}
            x={x}
            email={privateMap.get(x.id)?.email ?? meta.get(x.id)?.email}
          />
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-xl bg-white md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <Th>Ad</Th>
              <Th>Rol</Th>
              <Th>Durum</Th>
              <Th>Davet</Th>
              <Th>Son Giriş</Th>
            </tr>
          </thead>
          <tbody>
            {data?.map((x) => {
              const u = meta.get(x.id);
              return (
                <tr key={x.id} className="border-b">
                  <Td>
                    <Link
                      className="font-medium underline"
                      href={`/admin/staff/${x.id}`}
                    >
                      {x.full_name}
                    </Link>
                    <br />
                    <span className="text-xs text-[#526a64]">
                      {privateMap.get(x.id)?.email ?? u?.email ?? "—"}
                    </span>
                  </Td>
                  <Td>{labels[x.role]}</Td>
                  <Td>{x.status === "active" ? "Aktif" : "Pasif"}</Td>
                  <Td>
                    {u?.invited_at && !u.last_sign_in_at
                      ? "Davet bekliyor"
                      : "—"}
                  </Td>
                  <Td>
                    {u?.last_sign_in_at
                      ? new Intl.DateTimeFormat("tr-TR", {
                          dateStyle: "medium",
                        }).format(new Date(u.last_sign_in_at))
                      : "—"}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <nav className="mt-5 flex justify-between">
        <span>{count ?? 0} kayıt</span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link href={`?page=${page - 1}`} className="underline">
              Önceki
            </Link>
          ) : null}
          {page * size < (count ?? 0) ? (
            <Link href={`?page=${page + 1}`} className="underline">
              Sonraki
            </Link>
          ) : null}
        </div>
      </nav>
    </>
  );
}
function Card({
  x,
  email,
}: {
  x: {
    id: string;
    full_name: string;
    role: keyof typeof labels;
    status: string;
    created_at: string;
  };
  email?: string | null;
}) {
  return (
    <article className="rounded-xl bg-white p-5">
      <Link href={`/admin/staff/${x.id}`} className="font-semibold underline">
        {x.full_name}
      </Link>
      <p className="text-sm">{email ?? "—"}</p>
      <p className="mt-2 text-sm">
        {labels[x.role]} · {x.status === "active" ? "Aktif" : "Pasif"}
      </p>
    </article>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="p-4">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="p-4">{children}</td>;
}
