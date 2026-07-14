import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { visitTypeLabels } from "@/src/lib/admin/examinations";
import type { Database, DocumentType, UserRole } from "@/src/types/database";

import { canGenerateDocument } from "./document-permissions";
import { documentSourceKind, requiresFinalExamination } from "./document-source-policy";

export type DocumentSourceOption = { id: string; label: string };
const LIMIT = 20;

const date = (value: string, withTime = false) => new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  ...(withTime ? { timeStyle: "short" as const } : {}),
  timeZone: "Europe/Istanbul",
}).format(new Date(value));

function cleanSearch(value: string) {
  return value.trim().replace(/[,%()_*]/g, " ").replace(/\s+/g, " ").slice(0, 80);
}

async function matchingRelationshipIds(s: SupabaseClient<Database>, search: string) {
  if (!search) return { ownerIds: [] as string[], petIds: [] as string[] };
  const pattern = `%${search}%`;
  const [owners, pets] = await Promise.all([
    s.from("owners").select("id").ilike("full_name", pattern).limit(LIMIT),
    s.from("pets").select("id").or(`name.ilike.${pattern},microchip_number.ilike.${pattern}`).limit(LIMIT),
  ]);
  return { ownerIds: (owners.data ?? []).map((x) => x.id), petIds: (pets.data ?? []).map((x) => x.id) };
}

function relationshipFilter(ownerIds: string[], petIds: string[]) {
  return [
    ownerIds.length ? `owner_id.in.(${ownerIds.join(",")})` : "",
    petIds.length ? `pet_id.in.(${petIds.join(",")})` : "",
  ].filter(Boolean).join(",");
}

export async function getDocumentSourceOptions(
  s: SupabaseClient<Database>,
  role: UserRole,
  type: DocumentType,
  rawSearch = "",
  selectedId = "",
): Promise<DocumentSourceOption[]> {
  if (!canGenerateDocument(role, type)) return [];
  const search = cleanSearch(rawSearch);
  const { ownerIds, petIds } = await matchingRelationshipIds(s, search);
  const kind = documentSourceKind(type);

  if (kind === "examination") {
    let query = s.from("examinations").select("id,owner_id,pet_id,status,visit_type,created_at").neq("status", "archived");
    if (requiresFinalExamination(type)) query = query.eq("status", "finalized");
    const relationFilter = relationshipFilter(ownerIds, petIds);
    if (search && !relationFilter) return selectedId ? getDocumentSourceOptions(s, role, type, "", selectedId) : [];
    if (search) query = query.or(relationFilter);
    const { data } = await query.order("created_at", { ascending: false }).limit(LIMIT);
    const rows = [...(data ?? [])];
    if (selectedId && !rows.some((x) => x.id === selectedId)) {
      let selected = s.from("examinations").select("id,owner_id,pet_id,status,visit_type,created_at").eq("id", selectedId).neq("status", "archived");
      if (requiresFinalExamination(type)) selected = selected.eq("status", "finalized");
      const { data: selectedRow } = await selected.maybeSingle();
      if (selectedRow) rows.unshift(selectedRow);
    }
    const [owners, pets] = await Promise.all([
      rows.length ? s.from("owners").select("id,full_name").in("id", [...new Set(rows.map((x) => x.owner_id))]) : Promise.resolve({ data: [] }),
      rows.length ? s.from("pets").select("id,name").in("id", [...new Set(rows.map((x) => x.pet_id))]) : Promise.resolve({ data: [] }),
    ]);
    const ownerNames = new Map((owners.data ?? []).map((x) => [x.id, x.full_name]));
    const petNames = new Map((pets.data ?? []).map((x) => [x.id, x.name]));
    return rows.map((x) => ({ id: x.id, label: `${date(x.created_at)} · ${petNames.get(x.pet_id) ?? "Hayvan"} · ${ownerNames.get(x.owner_id) ?? "Hayvan sahibi"} · ${visitTypeLabels[x.visit_type]} · ${x.status === "finalized" ? "Final" : "Taslak"}` }));
  }

  if (kind === "appointment") {
    let query = s.from("appointments").select("id,owner_id,pet_id,starts_at,service_key,status");
    const relationFilter = relationshipFilter(ownerIds, petIds);
    if (search && !relationFilter) return selectedId ? getDocumentSourceOptions(s, role, type, "", selectedId) : [];
    if (search) query = query.or(relationFilter);
    const { data } = await query.order("starts_at", { ascending: false }).limit(LIMIT);
    const rows = [...(data ?? [])];
    if (selectedId && !rows.some((x) => x.id === selectedId)) {
      const { data: selectedRow } = await s.from("appointments").select("id,owner_id,pet_id,starts_at,service_key,status").eq("id", selectedId).maybeSingle();
      if (selectedRow) rows.unshift(selectedRow);
    }
    const [owners, pets] = await Promise.all([
      rows.length ? s.from("owners").select("id,full_name").in("id", [...new Set(rows.map((x) => x.owner_id))]) : Promise.resolve({ data: [] }),
      rows.length ? s.from("pets").select("id,name").in("id", [...new Set(rows.map((x) => x.pet_id))]) : Promise.resolve({ data: [] }),
    ]);
    const ownerNames = new Map((owners.data ?? []).map((x) => [x.id, x.full_name]));
    const petNames = new Map((pets.data ?? []).map((x) => [x.id, x.name]));
    return rows.map((x) => ({ id: x.id, label: `${date(x.starts_at, true)} · ${petNames.get(x.pet_id) ?? "Hayvan"} · ${ownerNames.get(x.owner_id) ?? "Hayvan sahibi"} · ${x.service_key}` }));
  }

  let query = s.from("pets").select("id,owner_id,name,species,microchip_number").is("archived_at", null);
  if (search) {
    const filters = [`name.ilike.%${search}%`, `microchip_number.ilike.%${search}%`, ownerIds.length ? `owner_id.in.(${ownerIds.join(",")})` : ""].filter(Boolean).join(",");
    query = query.or(filters);
  }
  const { data } = await query.order("name").limit(LIMIT);
  const rows = [...(data ?? [])];
  if (selectedId && !rows.some((x) => x.id === selectedId)) {
    const { data: selectedRow } = await s.from("pets").select("id,owner_id,name,species,microchip_number").eq("id", selectedId).is("archived_at", null).maybeSingle();
    if (selectedRow) rows.unshift(selectedRow);
  }
  const { data: owners } = rows.length
    ? await s.from("owners").select("id,full_name,archived_at").in("id", [...new Set(rows.map((x) => x.owner_id))]).is("archived_at", null)
    : { data: [] };
  const ownerNames = new Map((owners ?? []).map((x) => [x.id, x.full_name]));
  return rows.filter((x) => ownerNames.has(x.owner_id)).map((x) => ({
    id: x.id,
    label: `${x.name} · ${x.species} · ${ownerNames.get(x.owner_id)}${x.microchip_number ? ` · Mikroçip ${x.microchip_number}` : ""}`,
  }));
}
