"use client";
import{useMemo,useState}from"react";
import{renderReminderTemplate,sampleTemplateVariables}from"@/src/lib/admin/reminders/render-template";
export function TemplatePreview({body}:{body:string}){const[value,setValue]=useState(body),preview=useMemo(()=>{try{return renderReminderTemplate(value,sampleTemplateVariables)}catch{return"Bilinmeyen şablon değişkeni kullanıldı."}},[value]);return <div className="grid gap-3 lg:grid-cols-2"><textarea aria-label="Şablon gövdesi" value={value} onChange={e=>setValue(e.target.value)} className="min-h-36 rounded border p-3"/><pre className="whitespace-pre-wrap rounded bg-[#f4f0e8] p-3 font-sans text-sm">{preview}</pre></div>}
