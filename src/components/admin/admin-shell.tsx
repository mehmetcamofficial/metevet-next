import type { ReactNode } from "react";
import type { StaffSession } from "@/src/lib/auth/require-staff";

export function AdminShell({ session, children }: { session: StaffSession; children: ReactNode }) {
  void session;
  return children;
}
