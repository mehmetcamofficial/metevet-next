import "server-only";

import { notFound } from "next/navigation";

import { requireStaff } from "./require-staff";

export async function requireAdmin() {
  const session = await requireStaff();

  if (session.profile.role !== "admin") {
    notFound();
  }

  return session;
}
