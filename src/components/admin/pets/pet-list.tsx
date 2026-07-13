import Link from "next/link";
import { speciesLabels, type PetSpecies } from "@/src/lib/admin/records";
import { DataTable } from "../data-table";
import { StatusBadge } from "../status-badge";
import { PetCard, type PetListItem } from "./pet-card";

export function PetList({ pets }: { pets: PetListItem[] }) { return <><DataTable label="Hayvanlar" headings={["Ad", "Tür", "Irk", "Hayvan Sahibi", "Durum"]}>{pets.map((pet) => <tr key={pet.id}><th scope="row" className="px-5 py-4 font-semibold"><Link href={`/admin/pets/${pet.id}`} className="hover:underline">{pet.name}</Link></th><td className="px-5 py-4">{speciesLabels[pet.species as PetSpecies] ?? pet.species}</td><td className="px-5 py-4">{pet.breed ?? "—"}</td><td className="px-5 py-4">{pet.owner?.full_name ?? "—"}</td><td className="px-5 py-4"><StatusBadge archived={Boolean(pet.archived_at)} /></td></tr>)}</DataTable><div className="grid gap-4 md:hidden">{pets.map((pet) => <PetCard key={pet.id} pet={pet} />)}</div></>; }
