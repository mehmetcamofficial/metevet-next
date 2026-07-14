import assert from "node:assert/strict";
import test from "node:test";

import { changeOwner, petBelongsToOwner, petsForOwner, veterinarianProfiles } from "../../src/lib/admin/clinical-options.ts";
import { isExaminationEditable } from "../../src/lib/admin/examinations.ts";
import { istanbulDateTimeLocalToIso } from "../../src/lib/admin/appointments.ts";
import { isDuplicateReminder } from "../../src/lib/admin/reminders/scheduling.ts";

const owners = [{ id: "owner-empty", full_name: "Sahipsiz Seçim" }, { id: "owner-one", full_name: "Tek Hayvan" }];
const activePets = [{ id: "pet-active", owner_id: owners[1].id, name: "Mavi" }];

test("owner with zero active pets has an empty active option list", () => {
  assert.deepEqual(petsForOwner(activePets, owners[0].id), []);
});

test("owner with one active pet receives only that linked pet", () => {
  assert.deepEqual(petsForOwner(activePets, owners[1].id), [activePets[0]]);
});

test("owner with archived pet only is empty because archived rows are excluded server-side", () => {
  const serverReturnedActivePets = activePets.filter((pet) => pet.id !== "pet-active");
  assert.deepEqual(petsForOwner(serverReturnedActivePets, owners[1].id), []);
});

test("changing owner always clears the previously selected pet", () => {
  assert.deepEqual(changeOwner("owner-empty"), { ownerId: "owner-empty", petId: "" });
});

test("forged owner and pet pair is rejected by relationship validation", () => {
  assert.equal(petBelongsToOwner(activePets, owners[0].id, "pet-active"), false);
  assert.equal(petBelongsToOwner(activePets, owners[1].id, "pet-active"), true);
});

test("admin without veterinarian role is not a clinician option", () => {
  assert.deepEqual(veterinarianProfiles([{ id: "admin", full_name: "Admin", role: "admin" }]), []);
});

test("valid veterinarian profile is the only attributable clinician", () => {
  const profiles = [{ id: "admin", full_name: "Admin", role: "admin" as const }, { id: "vet", full_name: "Vet", role: "veterinarian" as const }];
  assert.deepEqual(veterinarianProfiles(profiles), [profiles[1]]);
});

test("finalized examination cannot be edited by veterinarian", () => {
  assert.equal(isExaminationEditable("finalized", "veterinarian"), false);
});

test("duplicate reminder source and type is detected", () => {
  const existing = [{ reminder_type: "vaccine_due", vaccine_record_id: "vaccine-1" }];
  assert.equal(isDuplicateReminder(existing, { reminder_type: "vaccine_due", vaccine_record_id: "vaccine-1" }), true);
});

test("datetime-local clinical values are interpreted as Istanbul wall time", () => {
  assert.equal(istanbulDateTimeLocalToIso("2026-07-14T14:30"), "2026-07-14T11:30:00.000Z");
  assert.equal(istanbulDateTimeLocalToIso("invalid"), null);
});
