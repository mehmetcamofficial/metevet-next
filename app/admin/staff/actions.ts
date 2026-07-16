"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isPersonnelRole, normalizePersonnelEmail, normalizePersonnelPhone } from "@/src/lib/admin/personnel";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { createServerActionClient } from "@/src/lib/supabase/server-action";
import type { PersonnelStatus, UserRole } from "@/src/types/database";

export type PersonnelState = { message: string | null; errors?: Record<string,string>; repairId?: string };
const redirectUrl = () => {
  const value = process.env.SUPABASE_AUTH_REDIRECT_URL?.trim();
  if (!value) return null;
  try { const url = new URL(value); return url.pathname === "/admin/reset-password" && (url.protocol === "https:" || url.hostname === "localhost") ? url.toString() : null; } catch { return null; }
};

export async function invitePersonnel(_state:PersonnelState,fd:FormData):Promise<PersonnelState>{
  const session=await requireAdmin(),admin=createAdminClient(),s=await createServerActionClient();
  if(!admin||!s)return{message:"Personel daveti için sunucu yapılandırması eksik."};
  const fullName=String(fd.get("fullName")??"").trim(),email=normalizePersonnelEmail(String(fd.get("email")??"")),role=String(fd.get("role")??""),phone=normalizePersonnelPhone(String(fd.get("phone")??"")),errors:Record<string,string>={};
  if(fullName.length<2)errors.fullName="Ad soyad en az iki karakter olmalıdır.";if(!email)errors.email="Geçerli bir e-posta girin.";if(!isPersonnelRole(role))errors.role="Geçerli bir rol seçin.";if(phone===undefined)errors.phone="Geçerli bir telefon numarası girin.";if(Object.keys(errors).length)return{message:"Alanları düzeltin.",errors};
  const target=redirectUrl();if(!target)return{message:"Parola kurulum yönlendirme adresi güvenli şekilde yapılandırılmamış."};
  const{data:existing}=await admin.from("personnel_private_profiles").select("id").ilike("email",email!).maybeSingle();if(existing)return{message:"Bu e-posta için zaten bir personel kaydı bulunuyor."};
  const{data,error}=await admin.auth.admin.inviteUserByEmail(email!,{redirectTo:target,data:{full_name:fullName,role,phone:phone??null}});
  if(error||!data.user){const{data:users}=await admin.auth.admin.listUsers({page:1,perPage:1000});const stranded=users.users.find(x=>normalizePersonnelEmail(x.email??"")===email);return stranded?{message:"Auth daveti mevcut ancak personel profili eksik. Güvenli onarım bağlantısını kullanın.",repairId:stranded.id}:{message:"Davet gönderilemedi. E-posta daha önce kullanılmış olabilir."};}
  const{error:profileError}=await admin.from("profiles").insert({id:data.user.id,full_name:fullName,role:role as UserRole,status:"active"});
  if(profileError)return{message:"Davet gönderildi ancak personel profili oluşturulamadı. Güvenli onarım bağlantısını kullanın.",repairId:data.user.id};const{error:privateError}=await admin.from("personnel_private_profiles").insert({id:data.user.id,email,phone:phone??null});if(privateError)return{message:"Davet ve profil oluşturuldu ancak özel iletişim kaydı tamamlanamadı. Güvenli onarım bağlantısını kullanın.",repairId:data.user.id};
  await s.from("audit_logs").insert({actor_user_id:session.id,action:"personnel_invited",entity_type:"profile",entity_id:data.user.id,metadata:{role,status:"active"}});
  revalidatePath("/admin/staff");redirect(`/admin/staff/${data.user.id}`);
}

export async function updatePersonnel(id:string,_state:PersonnelState,fd:FormData):Promise<PersonnelState>{
  const session=await requireAdmin();if(id===session.id)return{message:"Kendi rolünüzü veya durumunuzu değiştiremezsiniz."};
  const role=String(fd.get("role")??""),status=String(fd.get("status")??"") as PersonnelStatus,fullName=String(fd.get("fullName")??"").trim(),phone=normalizePersonnelPhone(String(fd.get("phone")??"")),errors:Record<string,string>={};
  if(!isPersonnelRole(role))errors.role="Geçerli rol seçin.";if(!["active","inactive"].includes(status))errors.status="Geçerli durum seçin.";if(fullName.length<2)errors.fullName="Ad soyad zorunludur.";if(phone===undefined)errors.phone="Telefon geçersiz.";if(Object.keys(errors).length)return{message:"Alanları düzeltin.",errors};
  const s=await createServerActionClient(),admin=createAdminClient();if(!s||!admin)return{message:"İşlem için sunucu yapılandırması eksik."};
  const[{data:old},{data:oldPrivate}]=await Promise.all([s.from("profiles").select("role,status").eq("id",id).maybeSingle(),s.from("personnel_private_profiles").select("phone").eq("id",id).maybeSingle()]);if(!old)return{message:"Personel bulunamadı."};
  if(old.role==="admin"&&old.status==="active"&&(role!=="admin"||status!=="active")){const{count}=await s.from("profiles").select("id",{count:"exact",head:true}).eq("role","admin").eq("status","active");if((count??0)<=1)return{message:"Son aktif yönetici pasifleştirilemez veya rolü değiştirilemez."};}
  const authPatch=status==="inactive"?{ban_duration:"876000h"}:{ban_duration:"none"};const{error:authError}=await admin.auth.admin.updateUserById(id,authPatch);if(authError)return{message:"Auth hesap durumu güncellenemedi."};
  const{error:privateError}=await s.from("personnel_private_profiles").update({phone:phone??null}).eq("id",id);if(privateError)return{message:"İletişim bilgileri güncellenemedi."};const{error}=await s.from("profiles").update({full_name:fullName,role:role as UserRole,status}).eq("id",id);if(error){await Promise.all([admin.auth.admin.updateUserById(id,{ban_duration:old.status==="inactive"?"876000h":"none"}),s.from("personnel_private_profiles").update({phone:oldPrivate?.phone??null}).eq("id",id)]);return{message:"Personel kaydı güncellenemedi; Auth durumu geri alındı."};}
  const events=[] as Array<{action:string;metadata:Record<string,string>}>;if(old.role!==role)events.push({action:"personnel_role_changed",metadata:{previous_role:old.role,new_role:role}});if(old.status!==status)events.push({action:status==="inactive"?"personnel_deactivated":"personnel_reactivated",metadata:{previous_status:old.status,new_status:status}});if(!events.length)events.push({action:"personnel_profile_updated",metadata:{fields:"full_name,phone"}});
  await s.from("audit_logs").insert(events.map(x=>({actor_user_id:session.id,action:x.action,entity_type:"profile",entity_id:id,metadata:x.metadata})));
  revalidatePath("/admin/staff");revalidatePath(`/admin/staff/${id}`);redirect(`/admin/staff/${id}`);
}

export async function repairPersonnelProfile(id:string){const session=await requireAdmin(),admin=createAdminClient(),s=await createServerActionClient();if(!admin||!s)throw new Error("Sunucu yapılandırması eksik.");const{data}=await admin.auth.admin.getUserById(id);if(!data.user)throw new Error("Auth kullanıcısı bulunamadı.");const meta=data.user.user_metadata??{},role=isPersonnelRole(String(meta.role??""))?meta.role:"staff",fullName=String(meta.full_name??data.user.email??"Personel").trim();const{error}=await admin.from("profiles").upsert({id,full_name:fullName,role,status:"active"});if(error)throw new Error("Profil onarılamadı.");const{error:privateError}=await admin.from("personnel_private_profiles").upsert({id,email:normalizePersonnelEmail(data.user.email??""),phone:normalizePersonnelPhone(String(meta.phone??""))??null});if(privateError)throw new Error("Özel profil onarılamadı.");await s.from("audit_logs").insert({actor_user_id:session.id,action:"personnel_profile_updated",entity_type:"profile",entity_id:id,metadata:{repair:"invitation_profile"}});revalidatePath("/admin/staff");redirect(`/admin/staff/${id}`)}

export async function resendPersonnelInvitation(id:string){const session=await requireAdmin(),admin=createAdminClient(),s=await createServerActionClient(),target=redirectUrl();if(!admin||!s||!target)throw new Error("Davet yapılandırması eksik.");const[{data:privateProfile},{data:userData}]=await Promise.all([admin.from("personnel_private_profiles").select("email").eq("id",id).maybeSingle(),admin.auth.admin.getUserById(id)]);if(!privateProfile?.email||!userData.user||userData.user.last_sign_in_at)throw new Error("Davet yeniden gönderilemez.");const{error}=await admin.auth.admin.inviteUserByEmail(privateProfile.email,{redirectTo:target,data:userData.user.user_metadata});if(error)throw new Error("Davet yeniden gönderilemedi. Supabase e-posta hız sınırını kontrol edin.");await s.from("audit_logs").insert({actor_user_id:session.id,action:"personnel_invitation_resent",entity_type:"profile",entity_id:id,metadata:{channel:"email"}});revalidatePath(`/admin/staff/${id}`)}
