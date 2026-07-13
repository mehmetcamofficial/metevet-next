import type { ReactNode } from "react";
import type { StaffSession } from "@/src/lib/auth/require-staff";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

export function AdminShell({ session, children }: { session: StaffSession; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f0e8] text-[#0d2922] lg:flex">
      <AdminSidebar />
      <div className="min-w-0 flex-1"><AdminHeader session={session} /><main className="px-5 py-7 lg:px-8">{children}</main></div>
    </div>
  );
}
