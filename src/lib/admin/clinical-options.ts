import type { UserRole } from "@/src/types/database";

export type OwnerOption = { id: string; full_name: string };
export type PetOption = { id: string; owner_id: string; name: string };
export type ProfileOption = { id: string; full_name: string; role: UserRole };

export function petsForOwner(pets: PetOption[], ownerId: string) {
  return ownerId ? pets.filter((pet) => pet.owner_id === ownerId) : [];
}

export function petBelongsToOwner(pets: PetOption[], ownerId: string, petId: string) {
  return pets.some((pet) => pet.id === petId && pet.owner_id === ownerId);
}

export function changeOwner(ownerId: string) {
  return { ownerId, petId: "" };
}

export function veterinarianProfiles(profiles: ProfileOption[]) {
  return profiles.filter((profile) => profile.role === "veterinarian");
}

export function isVeterinarianRole(role: UserRole) {
  return role === "veterinarian";
}
