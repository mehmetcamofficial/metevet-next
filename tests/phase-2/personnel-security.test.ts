import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { canMutatePersonnel, isPersonnelRole, normalizePersonnelEmail, passwordErrors } from "../../src/lib/admin/personnel.ts";

const root = new URL("../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

test("personnel routes require the server-side admin guard", () => {
  for (const path of ["app/admin/staff/page.tsx", "app/admin/staff/invite/page.tsx", "app/admin/staff/[id]/page.tsx", "app/admin/staff/[id]/edit/page.tsx"]) assert.match(read(path), /requireAdmin/);
});
test("staff and veterinarian cannot mutate personnel while admin can", () => {
  assert.equal(canMutatePersonnel("staff-1", "staff-2", "staff"), false);
  assert.equal(canMutatePersonnel("vet-1", "staff-2", "veterinarian"), false);
  assert.equal(canMutatePersonnel("admin-1", "staff-2", "admin"), true);
});
test("admin personnel listing is bounded and paginated", () => { const source=read("app/admin/staff/page.tsx");assert.match(source,/size\s*=\s*20/);assert.match(source,/\.range\(/); });
test("duplicate invitation is rejected without revealing Auth internals", () => { const source=read("app/admin/staff/actions.ts");assert.match(source,/zaten bir personel kaydı/);assert.doesNotMatch(source,/error\.message/); });
test("invalid personnel roles are rejected", () => { assert.equal(isPersonnelRole("owner"),false);assert.equal(isPersonnelRole("admin"),true); });
test("self role modification is rejected in application and database", () => { assert.equal(canMutatePersonnel("same","same","admin"),false);assert.match(read("supabase/migrations/20260720000000_personnel_and_account_security.sql"),/cannot change their own role/); });
test("final active admin demotion is protected", () => { assert.match(read("supabase/migrations/20260720000000_personnel_and_account_security.sql"),/final active administrator cannot be removed/i);assert.match(read("app/admin/staff/actions.ts"),/Son aktif yönetici/); });
test("inactive personnel are blocked by session and RLS role lookup", () => { assert.match(read("src/lib/auth/require-staff.ts"),/status !== "active"/);assert.match(read("supabase/migrations/20260720000000_personnel_and_account_security.sql"),/status='active'/); });
test("private personnel contact fields are isolated from shared profiles", () => { const migration=read("supabase/migrations/20260720000000_personnel_and_account_security.sql");assert.match(migration,/create table public\.personnel_private_profiles/);assert.match(migration,/Personnel read own private profile/);assert.match(migration,/Admins read private profiles/);assert.doesNotMatch(migration,/alter table public\.profiles\s+add column email/); });
test("inactive veterinarians are excluded from clinician selectors", () => { for(const path of ["app/admin/examinations/new/page.tsx","app/admin/vaccines/new/page.tsx","app/admin/parasites/new/page.tsx"])assert.match(read(path),/status","active/); });
test("forgot password always uses a generic response", () => { const source=read("app/admin/forgot-password/actions.ts");assert.match(source,/const generic=/);assert.equal((source.match(/return\{message:generic\}/g)??[]).length>=2,true); });
test("invalid recovery sessions are rejected", () => { assert.match(read("src/components/admin/personnel/password-form.tsx"),/getSession/);assert.match(read("src/components/admin/personnel/password-form.tsx"),/geçersiz veya süresi dolmuş/); });
test("password mismatch and strength validation are enforced", () => { assert.equal(passwordErrors("StrongPassword!9","different"),"Şifreler eşleşmiyor.");assert.equal(passwordErrors("StrongPassword!9","StrongPassword!9"),null); });
test("successful reset uses Supabase updateUser and then signs out", () => { const source=read("src/components/admin/personnel/password-form.tsx");assert.ok(source.indexOf("updateUser")<source.indexOf("signOut")); });
test("missing privileged key fails safely", () => { const source=read("src/lib/supabase/admin.ts");assert.match(source,/if \(!url \|\| !serviceRoleKey\) return null/); });
test("privileged key and admin client are never imported by client modules", () => {
  function files(dir:string):string[]{return readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(join(dir,x.name)):[join(dir,x.name)]).filter(x=>/\.(ts|tsx)$/.test(x))}
  for(const file of files(new URL("../../",import.meta.url).pathname)){const source=readFileSync(file,"utf8");if(/^\s*["']use client["'];/m.test(source)){assert.doesNotMatch(source,/SUPABASE_SERVICE_ROLE_KEY/);assert.doesNotMatch(source,/lib\/supabase\/admin/);}}
});
test("audit metadata excludes credentials and tokens", () => { const source=[read("app/admin/staff/actions.ts"),read("app/admin/forgot-password/actions.ts"),read("app/admin/reset-password/actions.ts")].join("\n");for(const secret of ["password:","access_token","refresh_token","invite_token","serviceRoleKey"])assert.doesNotMatch(source,new RegExp(secret)); });
test("personnel email normalization is deterministic", () => { assert.equal(normalizePersonnelEmail(" User@Example.COM "),"user@example.com");assert.equal(normalizePersonnelEmail("invalid"),null); });
