import { archiveDocument, deleteDocument, regenerateDocument } from "@/app/admin/documents/actions";
import { ConfirmDialog } from "@/src/components/admin/confirm-dialog";
import type { DocumentStatus, UserRole } from "@/src/types/database";

export function DocumentActions({ id, status, role, canArchive }: { id: string; status: DocumentStatus; role: UserRole; canArchive: boolean }) {
  const archived = status === "archived";
  return <div className="flex flex-wrap gap-3">
    <a href={`/admin/documents/${id}/download`} className="rounded bg-[#0d2922] px-4 py-2 text-white">PDF İndir</a>
    {!archived ? <form action={regenerateDocument.bind(null, id)}><button className="rounded border px-4 py-2">Yeniden Üret</button></form> : null}
    {canArchive ? <ConfirmDialog
      title={archived ? "Belgeyi geri yükle" : "Belgeyi arşivle"}
      description={archived ? "Belge yeniden aktif listelerde görünür." : "PDF korunur; belge aktif listelerden kaldırılır."}
      triggerLabel={archived ? "Geri Yükle" : "Arşivle"}
      confirmLabel={archived ? "Geri Yükle" : "Arşivle"}
      action={archiveDocument.bind(null, id, archived)}
    /> : null}
    {role === "admin" && archived ? <ConfirmDialog
      danger
      title="Belgeyi kalıcı olarak sil"
      description="Belge metadata kaydı ve private Storage içindeki PDF kalıcı olarak silinir. Bu işlem geri alınamaz."
      triggerLabel="Kalıcı Olarak Sil"
      confirmLabel="Kalıcı Olarak Sil"
      action={deleteDocument.bind(null, id)}
    /> : null}
  </div>;
}
