"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import type { DocumentSourceOption } from "@/src/lib/admin/documents/document-source-options";
import { sourceCreateLink, sourceEmptyState } from "@/src/lib/admin/documents/document-source-policy";
import type { DocumentType, UserRole } from "@/src/types/database";

export function DocumentSourceSelector({
  type,
  role,
  value,
  onChange,
  initialSource,
}: {
  type: DocumentType;
  role: UserRole;
  value: string;
  onChange: (value: string) => void;
  initialSource?: string;
}) {
  const searchId = useId();
  const selectId = useId();
  const statusId = useId();
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<DocumentSourceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      try {
        const params = new URLSearchParams({ type, q: search });
        if (initialSource && !search) params.set("selected", initialSource);
        const response = await fetch(`/admin/documents/source-options?${params}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("source-options");
        const payload = await response.json() as { options: DocumentSourceOption[] };
        setOptions(payload.options);
        if (value && !payload.options.some((item) => item.id === value)) onChange("");
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setOptions([]);
          setFailed(true);
          onChange("");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [initialSource, onChange, search, type, value]);

  const createLink = sourceCreateLink(type, role);
  return <fieldset className="space-y-3" aria-describedby={statusId}>
    <legend className="font-medium">Kaynak Kayıt</legend>
    <label htmlFor={searchId} className="block text-sm font-medium">Kaynak kayıtlarda ara</label>
    <input
      id={searchId}
      type="search"
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      placeholder="Hayvan veya hayvan sahibi ara"
      autoComplete="off"
      className="w-full rounded border p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d2922]"
    />
    <label htmlFor={selectId} className="block text-sm font-medium">Kaynak Kayıt</label>
    <select
      id={selectId}
      name="sourceId"
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={loading || failed || options.length === 0}
      aria-invalid={failed || undefined}
      className="w-full rounded border p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d2922] disabled:bg-slate-100"
    >
      <option value="">Seçiniz</option>
      {options.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select>
    <div id={statusId} aria-live="polite" className="text-sm text-[#526a64]">
      {loading ? <p>Kaynak kayıtlar yükleniyor…</p> : failed ? <p role="alert" className="text-red-700">Kaynak kayıtlar yüklenemedi. Lütfen yeniden deneyin.</p> : options.length === 0 ? <p>{sourceEmptyState(type)}</p> : <p>En fazla 20 eşleşen kayıt gösterilir.</p>}
      {!loading && !failed && options.length === 0 && createLink ? <Link href={createLink} className="mt-2 inline-block font-medium underline">Gerekli kaydı oluştur</Link> : null}
    </div>
  </fieldset>;
}
