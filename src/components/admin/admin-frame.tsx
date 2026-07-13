"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { StaffSession } from "@/src/lib/auth/require-staff";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

export function AdminFrame({ session, children }: { session: StaffSession; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  return <div className="min-h-screen bg-[#f4f0e8] text-[#0d2922] lg:flex">
    <AdminSidebar role={session.profile.role} open={open} onClose={() => setOpen(false)} />
    <div className="min-w-0 flex-1"><AdminHeader session={session} onMenu={() => setOpen(true)} /><main className="px-5 py-7 lg:px-8">{children}</main></div>
  </div>;
}
