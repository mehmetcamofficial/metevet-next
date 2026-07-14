"use client";

import { useActionState, useCallback, useState } from "react";
import { generateDocument, type DocumentFormState } from "@/app/admin/documents/actions";
import { DocumentSourceSelector } from "@/src/components/admin/documents/document-source-selector";
import { documentTypeLabels, documentTypes } from "@/src/lib/admin/documents/document-types";
import { changeDocumentType } from "@/src/lib/admin/documents/document-source-policy";
import type { DocumentType, UserRole } from "@/src/types/database";

export function DocumentGenerateForm({role,initialType,initialSource}:{role:UserRole;initialType?:string;initialSource?:string}) {
  const[state,action,pending]=useActionState<DocumentFormState,FormData>(generateDocument,{message:null});
  const allowedInitialType=documentTypes.find((item)=>item===initialType&&(role!=="staff"||item==="appointment_summary"))??"";
  const[type,setType]=useState<DocumentType|"">(allowedInitialType);const[sourceId,setSourceId]=useState(allowedInitialType&&initialSource?initialSource:"");
  const changeSource=useCallback((value:string)=>setSourceId(value),[]);
  return <form action={action} className="mt-6 space-y-5 rounded-2xl bg-white p-6">
    <label className="block">Belge Türü<select name="documentType" required value={type} onChange={(event)=>{const next=changeDocumentType(type,event.target.value,sourceId);setType(next.type as DocumentType|"");setSourceId(next.source);}} className="mt-1 w-full rounded border p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d2922]"><option value="">Seçiniz</option>{documentTypes.filter((item)=>role!=="staff"||item==="appointment_summary").map((item)=><option key={item} value={item}>{documentTypeLabels[item]}</option>)}</select></label>
    {type?<DocumentSourceSelector type={type} role={role} value={sourceId} onChange={changeSource} initialSource={type===allowedInitialType?initialSource:undefined}/>:<p className="text-sm text-[#526a64]">Kaynak kayıt seçmek için önce belge türünü seçin.</p>}
    <label>Dil<select name="language" className="ml-3 rounded border p-2"><option value="tr">Türkçe</option><option value="en">English</option></select></label>{role==="admin"?<label className="block"><input type="checkbox" name="includeInternalNotes"/> Dahili notları açıkça dahil et</label>:null}{state.message?<p role="alert" aria-live="polite" className="text-red-700">{state.message}</p>:null}<button disabled={pending||!sourceId} className="rounded bg-[#0d2922] px-5 py-3 text-white disabled:opacity-50">{pending?"Üretiliyor…":"PDF Oluştur"}</button>
  </form>;
}
