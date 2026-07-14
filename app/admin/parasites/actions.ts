"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { istanbulDateTimeLocalToIso } from "@/src/lib/admin/appointments";
import { canPermanentlyDelete } from "@/src/lib/admin/permissions";
import { canWritePreventive, preventiveStatuses } from "@/src/lib/admin/preventive-care";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

export type ParasiteState={message:string|null;errors?:Record<string,string>};

async function save(id:string|null,_state:ParasiteState,fd:FormData):Promise<ParasiteState>{
  const session=await requireStaff();if(!canWritePreventive(session.profile.role))return{message:"Yetkiniz bulunmuyor."};
  const v={ownerId:String(fd.get("ownerId")??""),petId:String(fd.get("petId")??""),veterinarianId:String(fd.get("veterinarianId")??""),treatmentType:String(fd.get("treatmentType")??""),productName:String(fd.get("productName")??"").trim(),batchNumber:String(fd.get("batchNumber")??"").trim()||null,administrationDate:String(fd.get("administrationDate")??""),nextDueDate:String(fd.get("nextDueDate")??"")||null,status:String(fd.get("status")??"completed"),notes:String(fd.get("notes")??"").trim()||null,internalNotes:String(fd.get("internalNotes")??"").trim()||null};
  const administrationIso=istanbulDateTimeLocalToIso(v.administrationDate),nextDueIso=v.nextDueDate?istanbulDateTimeLocalToIso(v.nextDueDate):null,errors:Record<string,string>={};
  if(!v.ownerId)errors.ownerId="Hayvan sahibi zorunludur.";if(!v.petId)errors.petId="Hayvan zorunludur.";if(!v.veterinarianId)errors.veterinarianId="Veteriner hekim zorunludur.";if(!["internal","external","combined"].includes(v.treatmentType))errors.treatmentType="Tedavi türü zorunludur.";if(!v.productName)errors.productName="Ürün adı zorunludur.";if(!administrationIso)errors.administrationDate="Geçerli tarih zorunludur.";if(v.nextDueDate&&!nextDueIso)errors.nextDueDate="Geçerli sonraki uygulama tarihi girin.";if(!preventiveStatuses.includes(v.status as never))errors.status="Geçerli durum seçin.";
  const s=await createClient();if(!s)return{message:"İşlem başarısız."};
  const[{data:owner},{data:pet},{data:vet}]=await Promise.all([s.from("owners").select("id").eq("id",v.ownerId).is("archived_at",null).maybeSingle(),s.from("pets").select("id,owner_id").eq("id",v.petId).eq("owner_id",v.ownerId).is("archived_at",null).maybeSingle(),s.from("profiles").select("id").eq("id",v.veterinarianId).eq("role","veterinarian").eq("status","active").maybeSingle()]);
  if(!owner)errors.ownerId="Geçerli aktif bir hayvan sahibi seçin.";if(!pet)errors.petId="Seçilen aktif hayvan bu hayvan sahibine ait değil.";if(!vet)errors.veterinarianId="Geçerli bir veteriner hekim seçin.";if(Object.keys(errors).length)return{message:"Alanları düzeltin.",errors};
  const record={pet_id:v.petId,owner_id:v.ownerId,veterinarian_id:v.veterinarianId,treatment_type:v.treatmentType as"internal"|"external"|"combined",product_name:v.productName,batch_number:v.batchNumber,administration_date:administrationIso!,next_due_date:nextDueIso,status:v.status as"scheduled"|"completed"|"expired"|"cancelled",notes:v.notes,internal_notes:v.internalNotes};
  const result=id?await s.from("parasite_records").update(record).eq("id",id).select("id").single():await s.from("parasite_records").insert(record).select("id").single();if(result.error||!result.data)return{message:"İşlem başarısız."};
  await s.from("audit_logs").insert({actor_user_id:session.id,action:id?"parasite_updated":record.status==="completed"?"parasite_completed":"parasite_created",entity_type:"parasite_record",entity_id:result.data.id,metadata:{status:record.status}});revalidatePath("/admin/parasites");revalidatePath(`/admin/pets/${v.petId}`);redirect(`/admin/parasites/${result.data.id}`);
}
export async function createParasite(s:ParasiteState,f:FormData){return save(null,s,f)}export async function updateParasite(id:string,s:ParasiteState,f:FormData){return save(id,s,f)}
async function life(id:string,action:"archive"|"restore"|"delete"){const session=await requireStaff();if(!canPermanentlyDelete(session.profile.role))throw new Error("Yetkiniz yok.");const s=await createClient();if(!s)throw new Error("İşlem başarısız.");const{data}=await s.from("parasite_records").select("pet_id").eq("id",id).single();if(!data)throw new Error("Kayıt yok.");const result=action==="delete"?await s.from("parasite_records").delete().eq("id",id):await s.from("parasite_records").update({archived_at:action==="archive"?new Date().toISOString():null}).eq("id",id);if(result.error)throw new Error("İşlem başarısız.");await s.from("audit_logs").insert({actor_user_id:session.id,action:`parasite_${action}d`,entity_type:"parasite_record",entity_id:id,metadata:{}});revalidatePath("/admin/parasites");revalidatePath(`/admin/pets/${data.pet_id}`);if(action==="delete")redirect("/admin/parasites")}
export async function archiveParasite(id:string){await life(id,"archive")}export async function restoreParasite(id:string){await life(id,"restore")}export async function deleteParasite(id:string){await life(id,"delete")}
