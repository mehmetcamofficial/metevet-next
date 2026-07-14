import { DocumentGenerateForm } from "@/src/components/admin/documents/document-generate-form";
import { requireStaff } from "@/src/lib/auth/require-staff";

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const session=await requireStaff(),query=await searchParams;
  return <><h1 className="text-3xl font-semibold">Belge Oluştur</h1><p className="mt-2 text-[#526a64]">Kaynak kayıt sunucuda aranır ve belge oluşturulmadan önce yeniden doğrulanır.</p><DocumentGenerateForm role={session.profile.role} initialType={query.type} initialSource={query.source}/></>;
}
