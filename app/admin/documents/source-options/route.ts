import { NextResponse } from "next/server";

import { canGenerateDocument } from "@/src/lib/admin/documents/document-permissions";
import { getDocumentSourceOptions } from "@/src/lib/admin/documents/document-source-options";
import { isDocumentType } from "@/src/lib/admin/documents/document-validation";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireStaff();
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "";
  if (!isDocumentType(type) || !canGenerateDocument(session.profile.role, type)) {
    return NextResponse.json({ message: "Belge türü veya yetki geçersiz." }, { status: 400 });
  }
  const s = await createClient();
  if (!s) return NextResponse.json({ message: "Kaynak kayıtlar yüklenemedi." }, { status: 500 });
  const options = await getDocumentSourceOptions(s, session.profile.role, type, url.searchParams.get("q") ?? "", url.searchParams.get("selected") ?? "");
  return NextResponse.json({ options }, { headers: { "Cache-Control": "private, no-store" } });
}
