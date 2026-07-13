import Link from "next/link";
import { speciesLabels, type PetSpecies } from "@/src/lib/admin/records";
import { StatusBadge } from "../status-badge";

export type PetListItem = { id: string; name: string; species: string; breed: string | null; archived_at: string | null; owner: { full_name: string } | null };
export function PetCard({ pet }: { pet: PetListItem }) { return <article className="rounded-xl border border-[#0d2922]/10 bg-white p-5"><div className="flex justify-between gap-3"><h2 className="font-semibold"><Link href={`/admin/pets/${pet.id}`} className="hover:underline">{pet.name}</Link></h2><StatusBadge archived={Boolean(pet.archived_at)} /></div><p className="mt-3 text-sm">{speciesLabels[pet.species as PetSpecies] ?? pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</p><p className="mt-1 text-sm text-[#526a64]">{pet.owner?.full_name ?? "Sahip bulunamadı"}</p></article>; }
