"use client";

import Link from "next/link";

import { changeOwner, petsForOwner, type OwnerOption, type PetOption } from "@/src/lib/admin/clinical-options";

const input = "mt-2 min-h-11 w-full rounded-lg border border-[#0d2922]/20 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#cda85f]/50";

export function OwnerPetFields({
  owners,
  pets,
  ownerId,
  petId,
  onOwnerChange,
  onPetChange,
  ownerError,
  petError,
  canCreatePet,
  disabled = false,
}: {
  owners: OwnerOption[];
  pets: PetOption[];
  ownerId: string;
  petId: string;
  onOwnerChange: (ownerId: string) => void;
  onPetChange: (petId: string) => void;
  ownerError?: string;
  petError?: string;
  canCreatePet: boolean;
  disabled?: boolean;
}) {
  const filteredPets = petsForOwner(pets, ownerId);
  const empty = Boolean(ownerId) && filteredPets.length === 0;
  return <>
    <div>
      <label htmlFor="ownerId" className="text-sm font-medium">Hayvan Sahibi</label>
      <select
        id="ownerId"
        name="ownerId"
        required
        disabled={disabled}
        value={ownerId}
        onChange={(event) => {
          const next = changeOwner(event.target.value);
          onOwnerChange(next.ownerId);
          onPetChange(next.petId);
        }}
        className={input}
        aria-invalid={Boolean(ownerError)}
        aria-describedby={ownerError ? "ownerId-error" : undefined}
      >
        <option value="">Seçiniz</option>
        {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name}</option>)}
      </select>
      {disabled ? <input type="hidden" name="ownerId" value={ownerId} /> : null}
      {ownerError ? <p id="ownerId-error" className="mt-1 text-sm text-red-700">{ownerError}</p> : null}
    </div>
    <div>
      <label htmlFor="petId" className="text-sm font-medium">Hayvan</label>
      <select
        id="petId"
        name="petId"
        required
        disabled={disabled || !ownerId || empty}
        value={petId}
        onChange={(event) => onPetChange(event.target.value)}
        className={input}
        aria-invalid={Boolean(petError)}
        aria-describedby={petError ? "petId-error" : empty ? "petId-empty" : undefined}
      >
        <option value="">Seçiniz</option>
        {filteredPets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
      </select>
      {disabled ? <input type="hidden" name="petId" value={petId} /> : null}
      {petError ? <p id="petId-error" className="mt-1 text-sm text-red-700">{petError}</p> : null}
      {empty ? <div id="petId-empty" role="status" className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        <p>Bu hayvan sahibine bağlı kayıtlı hayvan bulunmuyor.</p>
        {canCreatePet && !disabled ? <Link className="mt-2 inline-block font-medium underline" href={`/admin/pets/new?ownerId=${encodeURIComponent(ownerId)}`}>Bu sahip için hayvan ekle</Link> : null}
      </div> : null}
    </div>
  </>;
}
